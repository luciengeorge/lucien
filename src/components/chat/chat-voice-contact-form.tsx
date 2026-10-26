import { Button } from "#/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { sendContactMessage } from "#/lib/functions/send-contact-message";
import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { ChatContactCard } from "./chat-contact-card";

const ContactFormSchema = z.object({
  contact: z.string().max(200, "Keep this under 200 characters."),
  message: z.string().trim().min(1, "Write a few words for Lucien.").max(2000, "Keep it under 2,000 characters."),
  name: z.string().max(120, "Keep this under 120 characters."),
});

/**
 * What the voice agent's `show_contact_form` tool opens: the chat's contact message, typed rather
 * than dictated, so a name or an email address arrives spelled right. It sits over the call, which
 * carries on behind it.
 */
export function ChatVoiceContactForm({ onClose }: { onClose: () => void }) {
  const { capture } = useAnalytics();
  const [status, setStatus] = useState<"failed" | "sent" | null>(null);
  // Focus moves to the form, not its first field: a field would raise a phone's keyboard over the call.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    sectionRef.current?.focus();
  }, []);
  const form = useForm({
    formId: "voice-contact",
    defaultValues: { contact: "", message: "", name: "" },
    validators: {
      onSubmit: ContactFormSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await sendContactMessage({ data: value }).catch((): { status: "failed" } => ({
          status: "failed",
        }));
        capture(AnalyticsEvent.contactSubmitted, { source: "voice", status: result.status });
        setStatus(result.status);
      },
    },
  });

  const onSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="voice-contact-title"
      tabIndex={-1}
      className="absolute inset-x-0 bottom-0 max-h-[85svh] animate-in overflow-y-auto rounded-t-3xl bg-background px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-lg ring-1 ring-neutral-950/10 duration-200 fade-in slide-in-from-bottom-4 focus:outline-none sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-3xl sm:pb-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 id="voice-contact-title" className="text-base font-semibold tracking-tight text-neutral-950">
            Write to Lucien
          </h3>
          <p className="text-sm text-neutral-600">The call keeps going while you type.</p>
        </div>
        <Button
          aria-label="Close the form"
          className="-mt-1 -mr-1 size-9 rounded-full text-neutral-600"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </Button>
      </div>

      {status ? (
        <div className="space-y-4">
          <ChatContactCard status={status} />
          <Button className="h-10 w-full rounded-full" onClick={onClose} type="button" variant="outline">
            Back to the call
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="voice-contact-name">Your name (optional)</FieldLabel>
                  <Input
                    autoComplete="name"
                    id="voice-contact-name"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    value={field.state.value}
                  />
                  {field.state.meta.isValid ? null : <FieldError errors={field.state.meta.errors} />}
                </Field>
              )}
            </form.Field>
            <form.Field name="contact">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="voice-contact-contact">How to reach you (optional)</FieldLabel>
                  <Input
                    autoComplete="email"
                    id="voice-contact-contact"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Email, phone or a profile link"
                    value={field.state.value}
                  />
                  {field.state.meta.isValid ? null : <FieldError errors={field.state.meta.errors} />}
                </Field>
              )}
            </form.Field>
            <form.Field name="message">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="voice-contact-message">Message</FieldLabel>
                  <Textarea
                    className="min-h-24 resize-none"
                    id="voice-contact-message"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    value={field.state.value}
                  />
                  {field.state.meta.isValid ? null : <FieldError errors={field.state.meta.errors} />}
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button className="h-10 w-full rounded-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? <Spinner /> : null}
                  Send to Lucien
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      )}
    </section>
  );
}
