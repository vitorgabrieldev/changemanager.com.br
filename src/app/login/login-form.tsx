"use client";

import { useFormStatus } from "react-dom";
import { Shippori_Mincho } from "next/font/google";
import { PiWarningCircle } from "react-icons/pi";
import { signInWithGoogle } from "./actions";

const mincho = Shippori_Mincho({ subsets: ["latin"], weight: ["600"] });

const kanjiFont =
  '"Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", serif';

export function LoginForm({ next, error }: { next: string; error?: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full opacity-[0.09] blur-3xl"
        style={{ background: "var(--sol-red)" }}
      />

      <div className="relative w-full max-w-sm">
        <div
          aria-hidden
          className="absolute -top-4 -right-3 z-10 flex h-11 w-11 rotate-6 items-center justify-center rounded-[3px] border-2 bg-surface text-lg leading-none shadow-sm"
          style={{ borderColor: "var(--sol-red)", color: "var(--sol-red)", fontFamily: kanjiFont }}
        >
          家
        </div>

        <div className="rounded-sm border border-border bg-surface px-8 py-10 text-center shadow-sm">
          <div
            className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm text-lg font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #cb4b16, #b58900)" }}
          >
            A
          </div>

          <h1
            className={`${mincho.className} mb-3 text-[26px] tracking-wide text-foreground-strong`}
          >
            Amber
          </h1>

          <WaveDivider className="mx-auto mb-4 h-3 w-16 text-border" />

          <p className="mb-7 text-sm text-foreground-muted">
            Divida a mudança e compare imóveis entre vocês dois.
          </p>

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <SubmitButton />
          </form>

          {error && (
            <div
              className="mt-4 flex items-center gap-2 border-l-2 bg-danger-soft/60 px-3 py-2 text-left text-xs text-danger"
              style={{ borderColor: "var(--sol-red)" }}
            >
              <PiWarningCircle className="shrink-0 text-sm" />
              Não foi possível entrar. Tente novamente.
            </div>
          )}

          <div className="mt-7 border-t border-border pt-4">
            <p className="text-xs text-foreground-muted">
              Acesso somente por convite. Seu e-mail Google precisa já estar
              cadastrado numa casa.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function WaveDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 12" className={className} fill="none" aria-hidden>
      <path
        d="M0 6 Q8 0 16 6 T32 6 T48 6 T64 6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-sm border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground-strong transition hover:bg-surface-muted hover:[border-color:var(--sol-red)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <Spinner /> : <GoogleIcon />}
      {pending ? "Entrando..." : "Continuar com Google"}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-[18px] w-[18px] animate-spin text-foreground-muted"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}
