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
import { LoginFormSchema } from '#/lib/schemas/auth';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/login')({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();

  const form = useForm({
    formId: 'login',
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: LoginFormSchema,
      onSubmitAsync: async ({ value: { email, password } }) => {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          return {
            form: result.error.message,
          };
        }

        toast.success('Welcome back!', {
          description: 'Login successful',
        });
        navigate({ to: '/' });
      },
    },
  });

  const onSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <form.Field name='email'>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type='email'
                      placeholder='Enter your email'
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
              <form.Field name='password'>
                {(field) => (
                  <Field>
                    <div className='flex items-center'>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Link
                        to='/api/auth/$'
                        className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      type='password'
                      placeholder='Enter your password'
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
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                  errorMap: state.errorMap,
                })}
              >
                {({ canSubmit, isSubmitting, errorMap }) => (
                  <Field>
                    <Button type='submit' disabled={!canSubmit || isSubmitting}>
                      Login
                    </Button>
                    {errorMap.onSubmit?.form ? (
                      <FieldError>{errorMap.onSubmit.form}</FieldError>
                    ) : null}
                    <FieldDescription className='text-center'>
                      Don't have an account? <Link to='/signup'>Sign up</Link>
                    </FieldDescription>
                  </Field>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
