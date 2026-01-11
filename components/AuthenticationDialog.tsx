"use client";

import { FormEvent, useId, useState } from "react";

export type AuthCredentials = {
  email: string;
  accessCode: string;
};

type AuthenticationDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  helperText?: string;
  expectedCodeHint?: string;
  onSubmit: (credentials: AuthCredentials) => void;
};

export function AuthenticationDialog({
  open,
  isSubmitting = false,
  errorMessage,
  helperText = "Enter the shared secret from the field kit manifest.",
  expectedCodeHint,
  onSubmit,
}: AuthenticationDialogProps) {
  const emailInputId = useId();
  const codeInputId = useId();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ email, accessCode });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 px-6 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Access Required</p>
          <h1 className="text-2xl font-semibold">Authenticate to enter</h1>
          <p className="text-sm text-zinc-400">{helperText}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label htmlFor={emailInputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Operator email
            </label>
            <input
              id={emailInputId}
              type="email"
              placeholder="crew@roboinspector.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={codeInputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Access code
            </label>
            <input
              id={codeInputId}
              type="password"
              placeholder="••••••••"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
              required
              minLength={4}
            />
            {expectedCodeHint ? (
              <p className="text-xs text-zinc-500">Demo code: {expectedCodeHint}</p>
            ) : null}
          </div>
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
              {errorMessage}
            </div>
          ) : null}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validating…" : "Unlock dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
