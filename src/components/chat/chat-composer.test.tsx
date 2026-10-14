import { cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatComposer } from "./chat-composer";
import { createPoofSignals, PoofSignalsContext } from "./poof-signals";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderStreaming() {
  const onStop = vi.fn();
  render(
    <ChatComposer
      canSubmit
      isStreaming
      isSubmitting={false}
      message=""
      onBlur={vi.fn()}
      onChange={vi.fn()}
      onResumeRequest={vi.fn()}
      onStop={onStop}
      onSubmit={vi.fn()}
    />,
  );
  return onStop;
}

describe("ChatComposer Escape", () => {
  it("stops the reply", () => {
    const onStop = renderStreaming();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  /* Each of these closes on its own Escape listener without preventDefault. */
  it("leaves it to Streamdown's link modal when that is open", () => {
    const onStop = renderStreaming();
    const modal = document.createElement("div");
    modal.dataset.streamdown = "link-safety-modal";
    document.body.append(modal);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });

  it("leaves it to an open menu", () => {
    const onStop = renderStreaming();
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const item = document.createElement("button");
    menu.append(item);
    document.body.append(menu);
    item.focus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });

  it("leaves it to an IME composition", () => {
    const onStop = renderStreaming();
    fireEvent.keyDown(document, { isComposing: true, key: "Escape" });
    expect(onStop).not.toHaveBeenCalled();
  });
});

describe("ChatComposer and Poof", () => {
  it("tells Poof the visitor is typing", () => {
    const signals = createPoofSignals();
    const heard = vi.fn();
    signals.subscribe(heard);
    const { getByLabelText } = render(
      <PoofSignalsContext value={signals}>
        <ChatComposer
          canSubmit
          isStreaming={false}
          isSubmitting={false}
          message=""
          onBlur={vi.fn()}
          onChange={vi.fn()}
          onResumeRequest={vi.fn()}
          onStop={vi.fn()}
          onSubmit={vi.fn()}
        />
      </PoofSignalsContext>,
    );

    fireEvent.change(getByLabelText("Ask Poof about Lucien"), { target: { value: "H" } });
    expect(heard).toHaveBeenCalledWith("typing");
  });
});

describe("ChatComposer Stop button", () => {
  it("never sends from the same click, even when stopping refills the composer at once", () => {
    // Stop and Send share a slot. If React reuses the one <button> and flips it to type=submit
    // during the click, the browser's default action then submits the form: an undo-send that
    // put the question back would resend it immediately.
    const onSubmit = vi.fn((event: React.SubmitEvent<HTMLFormElement>) => event.preventDefault());
    function Harness() {
      const [streaming, setStreaming] = useState(true);
      const [message, setMessage] = useState("");
      return (
        <ChatComposer
          canSubmit
          isStreaming={streaming}
          isSubmitting={false}
          message={message}
          onBlur={vi.fn()}
          onChange={setMessage}
          onResumeRequest={vi.fn()}
          onStop={() => {
            // In a browser the refill lands in a microtask that still runs before the click's
            // default action; jsdom runs that action first, so force the update in synchronously.
            flushSync(() => {
              setStreaming(false);
              setMessage("What does he build?");
            });
          }}
          onSubmit={onSubmit}
        />
      );
    }
    const { getByRole } = render(<Harness />);

    fireEvent.click(getByRole("button", { name: "Stop" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
