import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

import { useRegisterUser, getGetCurrentUserQueryKey, UserRole } from '@workspace/api-client-react';
import { AuthAlternatives } from '@/pages/LoginPage';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterUser();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: UserRole.couple,
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { 
        data: {
          ...data,
          preferredLocale: i18n.language as 'uz' | 'ru' | 'en'
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation('/dashboard');
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 py-12 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-primary mb-2 inline-block">
            Bazm
          </Link>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-4 mb-2">
            {t('auth.register.title')}
          </h1>
          <p className="text-muted-foreground">{t('auth.register.subtitle')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fields.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Azizbek" {...field} className="h-12 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fields.phone')} (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+998 90 123 45 67" {...field} className="h-12 bg-background" />
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
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fields.role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder={t('auth.fields.role')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.couple}>{t('auth.roles.couple')}</SelectItem>
                      <SelectItem value={UserRole.vendor}>{t('auth.roles.vendor')}</SelectItem>
                      <SelectItem value={UserRole.organizer}>{t('auth.roles.organizer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {registerMutation.isError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                Failed to register. Please check your inputs and try again.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 mt-4"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? '...' : t('auth.register.submit')}
            </Button>
          </form>
        </Form>

        <AuthAlternatives
          queryClient={queryClient}
          onAuthenticated={() => setLocation('/dashboard')}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t('auth.register.haveAccount')}{' '}
          <Link href="/login" className="text-primary font-semibold underline underline-offset-2 hover:opacity-80">
            {t('auth.register.goLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}