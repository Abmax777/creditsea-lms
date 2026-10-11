"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import type { User } from "@/lib/types";
import { Alert, Button, Card, Field, Input } from "./ui";

type FieldErrors = Partial<Record<"name" | "email" | "password", string[]>>;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const { user } = await api<{ user: User }>(`/auth/${mode}`, { method: "POST", json: body });
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") ? next : homeFor(user.role));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setFieldErrors(err.details as FieldErrors);
      else setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {isSignup ? "Sign up to apply for a personal loan." : "Log in to continue."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && <Alert>{error}</Alert>}
        {isSignup && (
          <Field label="Name" error={fieldErrors.name?.[0]}>
            <Input name="name" required minLength={2} autoComplete="name" />
          </Field>
        )}
        <Field label="Email" error={fieldErrors.email?.[0]}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" error={fieldErrors.password?.[0]} hint={isSignup ? "At least 8 characters" : undefined}>
          <Input
            name="password"
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          {isSignup ? "Sign up" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-brand-600 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </Card>
  );
}
