"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authQueryKeys, login } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { type LoginFormValues, loginSchema } from "@/lib/schemas";

const ADMIN_LOGIN_DEFAULTS: LoginFormValues = {
  email: "ava.admin@coastaleats.com",
  password: "Coastal123!",
};

export function LoginView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: ADMIN_LOGIN_DEFAULTS,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.currentUser, {
        user: response.user,
      });

      toast.success(`Welcome back, ${response.user.name}.`);
      router.replace(response.redirectTo);
      router.refresh();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Unable to sign in.");
      form.setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (values) => {
    form.clearErrors("root");
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0)_26%),radial-gradient(circle_at_top_left,rgba(66,137,149,0.2),transparent_34%),radial-gradient(circle_at_top_right,rgba(224,132,82,0.14),transparent_26%),linear-gradient(135deg,rgba(242,236,224,0.96),rgba(246,247,244,0.92))] w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-5">
        <Card className="w-full max-w-136 border-white/70 bg-white/88 shadow-[0_2.5rem_7rem_-3rem_rgba(15,23,42,0.35)] backdrop-blur-md">
          <CardHeader className="gap-5 border-b border-border/60 bg-[linear-gradient(160deg,rgba(66,137,149,0.1),rgba(255,255,255,0.45)_58%,rgba(224,132,82,0.09))]">
            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
              ShiftSync
            </Badge>
            <div className="space-y-2">
              <CardTitle className="clamp-[text,2xl,4xl]">
                Welcome back
              </CardTitle>
              <CardDescription>Sign in to continue.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Work Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="you@coastaleats.com"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldError
                errors={
                  form.formState.errors.root
                    ? [form.formState.errors.root]
                    : undefined
                }
              />

              <Button
                type="submit"
                className="w-full"
                loading={loginMutation.isPending}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
