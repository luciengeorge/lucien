import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { NavLink } from "#/components/ui/nav-link";
import { Spinner } from "#/components/ui/spinner";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { authClient } from "#/lib/auth-client";
import { EmailSchema, NameSchema, PasswordSchema } from "#/lib/schemas/auth";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
  head: () => ({
    meta: [{ title: "Sign up" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function SignupPage() {
  const { capture } = useAnalytics();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmitAsync: async ({ value: { name, email, password } }) => {
        capture(AnalyticsEvent.userSignupSubmitted, {
          signup_method: "email",
        });

        try {
          const result = await authClient.signUp.email({ name, email, password });
          if (result.error) {
            capture(AnalyticsEvent.userSignupFailed, {
              error_message: result.error.message,
              signup_method: "email",
            });
            return { form: result.error.message };
          }

          capture(AnalyticsEvent.userSignedUp, {
            signup_method: "email",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown signup error";
          capture(AnalyticsEvent.userSignupFailed, {
            error_message: message,
            signup_method: "email",
          });
          return { form: message };
        }

        toast.success("Account created", {
          description: "You signed up successfully",
        });
        navigate({ to: "/" });
      },
    },
  });

  const onSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <form.Field name="name" validators={{ onBlur: NameSchema }}>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="Enter your name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
            <form.Field name="email" validators={{ onBlur: EmailSchema }}>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="Enter your email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
            <form.Field name="password" validators={{ onBlur: PasswordSchema }}>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="Enter your password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onBlur: ({ value, fieldApi }) => {
                  if (value !== fieldApi.form.getFieldValue("password")) return "Passwords do not match";
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="Confirm your password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
                errorMap: state.errorMap,
              })}
            >
              {({ canSubmit, isSubmitting, errorMap }) => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? <Spinner /> : null}
                    {isSubmitting ? "Creating Account" : "Create Account"}
                  </Button>
                  {errorMap.onSubmit?.form ? <FieldError>{String(errorMap.onSubmit.form)}</FieldError> : null}
                  <FieldDescription className="px-6 text-center">
                    Already have an account? <NavLink to="/login">Sign in</NavLink>
                  </FieldDescription>
                </Field>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
