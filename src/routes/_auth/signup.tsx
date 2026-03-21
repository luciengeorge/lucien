import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import { authClient } from '#/lib/auth-client';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link } from '@tanstack/react-router';
import z from 'zod';

// ─── ROUTING ───────────────────────────────────────────────
// src/routes/signup.tsx → /signup route.
// Same pattern as login.tsx. TanStack Start auto-registers
// every file in src/routes/ into the route tree.
export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
});

const SignupFormSchema = z
  .object({
    name: z.string(),
    email: z.email(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Passwords do not match',
      });
    }
  });

function SignupPage() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onChange: SignupFormSchema,
      onSubmitAsync: async ({ value: { name, email, password } }) => {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) {
          return {
            form: result.error.message,
          };
        }
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
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <form.Field name='name'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                  <Input
                    id={field.name}
                    type='text'
                    placeholder='Enter your name'
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  {field.state.meta.isValid ? null : (
                    <FieldError>
                      {field.state.meta.errors.join(', ')}
                    </FieldError>
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field name='email'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    type='email'
                    placeholder='m@example.com'
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  <FieldDescription>
                    We&apos;ll use this to contact you. We will not share your
                    email with anyone else.
                  </FieldDescription>
                  {field.state.meta.isValid ? null : (
                    <FieldError>
                      {field.state.meta.errors.join(', ')}
                    </FieldError>
                  )}
                </Field>
              )}
            </form.Field>
            <Field>
              <FieldLabel htmlFor='password'>Password</FieldLabel>
              <Input id='password' type='password' required />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor='confirm-password'>
                Confirm Password
              </FieldLabel>
              <Input id='confirm-password' type='password' required />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type='submit'>Create Account</Button>
                <FieldDescription className='px-6 text-center'>
                  Already have an account? <Link to='/login'>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
