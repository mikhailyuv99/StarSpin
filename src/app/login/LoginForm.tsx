"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Vérifiez votre email pour confirmer votre compte.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    }

    setLoading(false);
  };

  const inputClass =
    "w-full rounded-sm border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-zinc-400 focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="marketing-grid hidden flex-1 border-r border-zinc-800 bg-ink p-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-[11px] font-bold text-ink">
            RF
          </span>
          <span className="text-[15px] font-semibold text-white">Roue Fidélité</span>
        </Link>
        <div>
          <p className="section-label text-cyan-400">Espace commerçant</p>
          <p className="mt-4 max-w-sm text-2xl font-semibold leading-snug tracking-tight text-white">
            Gérez votre programme de fidélisation depuis un tableau de bord unique.
          </p>
        </div>
        <p className="font-mono text-xs text-zinc-500">Da Nang · Vietnam</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-[15px] font-semibold text-ink">
              ← Roue Fidélité
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {isSignup ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isSignup ? "Accès commerçant à la plateforme" : "Identifiants de votre espace"}
          </p>

          {error && (
            <p className="mt-6 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-6 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Chargement…" : isSignup ? "Créer le compte" : "Se connecter"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="mt-6 w-full text-center text-sm text-muted hover:text-ink"
          >
            {isSignup ? "Déjà un compte — se connecter" : "Pas de compte — s'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
