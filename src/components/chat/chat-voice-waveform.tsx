import { useReducedMotion, useReducedMotionConfig } from "motion/react";
import { useImperativeHandle, useRef } from "react";

export type VoiceWaveformHandle = {
  /** One frame of the call's input spectrum (bytes, 0 to 255), straight from the SDK. */
  draw: (bins: Uint8Array) => void;
};

const BARS = 21;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_MIN = 3;
const FADE_WIDTH = 16;
/** Average level, 0 to 1, that counts as the visitor speaking, and how long it lingers after. */
const SPEAKING_LEVEL = 0.12;
const SPEAKING_HOLD_MS = 300;

/**
 * "I hear you": the visitor's voice as a small row of bars under Poof. Drawn in the style of the
 * ElevenLabs UI Waveform (rounded bars, brighter when louder, faded edges), but on its own canvas
 * by `draw`, called from Poof's animation frame: that Waveform redraws on a `data` prop, which
 * would re-render React every frame. Fed from the SDK's input analyser, never a second microphone.
 *
 * Fades in while the visitor is actually speaking. Nothing at all under reduced motion.
 */
export function ChatVoiceWaveform({ ref }: { ref?: React.Ref<VoiceWaveformHandle> }) {
  const prefersStill = useReducedMotion() ?? false;
  const forcedStill = useReducedMotionConfig() ?? false;
  const still = prefersStill || forcedStill;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loudAtRef = useRef(-Infinity);

  useImperativeHandle(
    ref,
    () => ({
      draw(bins) {
        const wrapper = wrapperRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!wrapper || !canvas || !ctx) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(width * dpr)) {
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Speech sits low in the spectrum: the lowest bins go to the middle bar, highs to the edges.
        const half = Math.ceil(BARS / 2);
        const span = Math.max(1, Math.floor((bins.length * 0.6) / half));
        const levels = Array.from({ length: half }, (_, index) => {
          let sum = 0;
          for (let bin = index * span; bin < (index + 1) * span; bin++) sum += bins[bin] ?? 0;
          return sum / span / 255;
        });
        const mean = levels.reduce((total, level) => total + level, 0) / half;

        ctx.fillStyle = getComputedStyle(wrapper).color;
        const left = (width - (BARS * BAR_WIDTH + (BARS - 1) * BAR_GAP)) / 2;
        for (let bar = 0; bar < BARS; bar++) {
          const level = levels[Math.abs(bar - (BARS - 1) / 2)] ?? 0;
          const barHeight = Math.max(BAR_MIN, level * height * 0.9);
          ctx.globalAlpha = 0.3 + level * 0.7;
          ctx.beginPath();
          ctx.roundRect(left + bar * (BAR_WIDTH + BAR_GAP), (height - barHeight) / 2, BAR_WIDTH, barHeight, 1.5);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        const fade = ctx.createLinearGradient(0, 0, width, 0);
        const edge = Math.min(0.3, FADE_WIDTH / width);
        fade.addColorStop(0, "rgba(0,0,0,1)");
        fade.addColorStop(edge, "rgba(0,0,0,0)");
        fade.addColorStop(1 - edge, "rgba(0,0,0,0)");
        fade.addColorStop(1, "rgba(0,0,0,1)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";

        const now = performance.now();
        if (mean >= SPEAKING_LEVEL) loudAtRef.current = now;
        const speaking = String(now - loudAtRef.current < SPEAKING_HOLD_MS);
        if (wrapper.dataset.speaking !== speaking) wrapper.dataset.speaking = speaking;
      },
    }),
    [],
  );

  if (still) return null;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="h-6 w-32 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out data-[speaking=true]:opacity-100"
      data-slot="voice-waveform"
      data-speaking="false"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
