import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldAlert, Timer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Rate limiting state
  const [attempts, setAttempts] = useState(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const lockoutInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  // Countdown timer when locked out
  useEffect(() => {
    if (lockoutSecondsLeft > 0) {
      lockoutInterval.current = setInterval(() => {
        setLockoutSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(lockoutInterval.current!);
            setAttempts(0); // reset attempts after lockout expires
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockoutInterval.current) clearInterval(lockoutInterval.current);
    };
  }, [lockoutSecondsLeft]);

  const isLockedOut = lockoutSecondsLeft > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutSecondsLeft(LOCKOUT_SECONDS);
        toast.error("Demasiadas tentativas", {
          description: `Aguarda ${LOCKOUT_SECONDS} segundos antes de tentar novamente.`,
        });
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        toast.error("Credenciais inválidas", {
          description: `${remaining} tentativa${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}.`,
        });
      }
      return;
    }

    toast.success("Bem-vindo!");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-white via-[#F5F8F3] to-[#EBF0E5] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img
            src="/logo.png"
            alt="ISAF Refeitório"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 p-8">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Aceder ao painel</h1>
          <p className="text-sm text-slate-500 mt-1">Entre com as suas credenciais.</p>

          {/* Lockout warning banner */}
          {isLockedOut && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">Conta temporariamente bloqueada</p>
                <p className="text-xs text-amber-600 mt-0.5">Demasiadas tentativas falhadas.</p>
              </div>
              <div className="flex items-center gap-1 text-amber-700 shrink-0">
                <Timer className="w-4 h-4" />
                <span className="text-sm font-bold tabular-nums">{lockoutSecondsLeft}s</span>
              </div>
            </div>
          )}

          {/* Attempt warning */}
          {!isLockedOut && attempts > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100">
              <p className="text-xs text-rose-600">
                {MAX_ATTEMPTS - attempts} tentativa{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} restante{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} antes do bloqueio temporário.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLockedOut}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="voce@restaurante.pt"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLockedOut}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || isLockedOut}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLockedOut ? `Aguarda ${lockoutSecondsLeft}s…` : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}