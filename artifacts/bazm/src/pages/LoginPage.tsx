import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { SiGoogle } from 'react-icons/si';

import {
  useLoginUser,
  useRequestPhoneOtp,
  useVerifyPhoneOtp,
  getGetCurrentUserQueryKey,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/**
 * Secondary sign-in options shared by the login and register pages: a
 * full-page Google redirect and a phone one-time-code flow. On success the
 * phone flow mirrors the email login (invalidate current-user, go to
 * /dashboard).
 */
export function AuthAlternatives({
  queryClient,
  onAuthenticated,
}: {
  queryClient: QueryClient;
  onAuthenticated: () => void;
}) {
  const { t } = useTranslation();
  const requestOtp = useRequestPhoneOtp();
  const verifyOtp = useVerifyPhoneOtp();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!phone.trim()) return;
    try {
      const result = await requestOtp.mutateAsync({ data: { phone: phone.trim() } });
      setCodeSent(true);
      setDevCode(result?.devCode ?? null);
    } catch {
      // Error surfaces inline via requestOtp.isError; swallow the rejection so
      // it doesn't bubble up as an unhandled promise / dev error overlay.
    }
  };

  const handleVerify = async () => {
    if (!phone.trim() || !code.trim()) return;
    try {
      await verifyOtp.mutateAsync({ data: { phone: phone.trim(), code: code.trim() } });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      onAuthenticated();
    } catch {
      // Error surfaces inline via verifyOtp.isError; swallow the rejection.
    }
  };

  return (
    <div className="mt-8">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('auth.orContinueWith')}
        </span>
        <div className="flex-grow border-t border-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-6 w-full h-12 text-base rounded-xl gap-2"
        onClick={() => {
          window.location.href = '/api/auth/google';
        }}
        data-testid="button-google-signin"
      >
        <SiGoogle className="h-4 w-4" />
        {t('auth.continueWithGoogle')}
      </Button>

      <div className="mt-6 space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="auth-phone">
            {t('auth.phoneNumber')}
          </label>
          <div className="flex gap-2">
            <Input
              id="auth-phone"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-background"
              data-testid="input-phone-otp"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-xl whitespace-nowrap"
              onClick={handleSendCode}
              disabled={requestOtp.isPending || !phone.trim()}
              data-testid="button-send-code"
            >
              {requestOtp.isPending ? '...' : t('auth.sendCode')}
            </Button>
          </div>
          {requestOtp.isError && (
            <p className="text-sm text-destructive" data-testid="text-otp-request-error">
              {t('auth.otpRequestFailed')}
            </p>
          )}
        </div>

        {codeSent && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-xs text-muted-foreground" data-testid="text-code-sent-hint">
              {t('auth.codeSentHint')}
            </p>
            {devCode && (
              <p className="text-xs text-muted-foreground" data-testid="text-dev-code-hint">
                {t('auth.devCodeHint', { code: devCode })}
              </p>
            )}
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t('auth.enterCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 bg-background"
              data-testid="input-verify-code"
            />
            <Button
              type="button"
              className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90"
              onClick={handleVerify}
              disabled={verifyOtp.isPending || !code.trim()}
              data-testid="button-verify-signin"
            >
              {verifyOtp.isPending ? '...' : t('auth.verifyAndSignIn')}
            </Button>
            {verifyOtp.isError && (
              <p className="text-sm text-destructive" data-testid="text-otp-verify-error">
                {t('auth.otpVerifyFailed')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLoginUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const errorParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;
  const googleError =
    errorParam === 'google_not_configured'
      ? t('auth.googleNotConfigured')
      : errorParam === 'google'
        ? t('auth.googleFailed')
        : null;

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation('/dashboard');
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-primary mb-2 inline-block">
            Bazm
          </Link>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-4 mb-2">
            {t('auth.login.title')}
          </h1>
          <p className="text-muted-foreground">{t('auth.login.subtitle')}</p>
        </div>

        {googleError && (
          <div
            className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20"
            data-testid="text-google-error"
          >
            {googleError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fields.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} className="h-12 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fields.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loginMutation.isError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                Invalid email or password. Please try again.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? '...' : t('auth.login.submit')}
            </Button>
          </form>
        </Form>

        <AuthAlternatives
          queryClient={queryClient}
          onAuthenticated={() => setLocation('/dashboard')}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" className="text-primary font-semibold underline underline-offset-2 hover:opacity-80">
            {t('auth.login.goRegister')}
          </Link>
        </div>
      </div>
    </div>
  );
}