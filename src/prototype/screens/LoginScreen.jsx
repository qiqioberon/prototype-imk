import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, Mail, ShieldCheck, X } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { cx } from "../lib/format.js";
import { BrandMark, StatusBar } from "../components/layout/index.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_DELAY_MS = 700;
const GOOGLE_DELAY_MS = 900;
const RESET_DELAY_MS = 800;

export function LoginScreen() {
  const { setScreen, showToast } = usePrototype();
  const [email, setEmail] = useState("user@gmail.com");
  const [password, setPassword] = useState("rahasia123");
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("user@gmail.com");
  const [resetError, setResetError] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const timeoutRefs = useRef([]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function schedule(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutRefs.current.push(timeoutId);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    const nextErrors = validateLoginFields(email, password);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      showToast("Login belum valid", "Periksa lagi email dan password Anda.");
      return;
    }

    setFieldErrors({});
    setIsLoginLoading(true);

    schedule(() => {
      setIsLoginLoading(false);
      showToast(
        "Login berhasil",
        rememberMe ? "Selamat datang kembali. Akun Anda tetap diingat pada perangkat ini." : "Selamat datang kembali di FocusTunes."
      );
      setScreen("home");
    }, LOGIN_DELAY_MS);
  }

  function handleGoogleLogin() {
    if (isLoginLoading || isGoogleLoading) return;

    setFieldErrors({});
    setIsGoogleLoading(true);

    schedule(() => {
      setIsGoogleLoading(false);
      showToast("Google terhubung", "Login Google berhasil dan Anda masuk ke Home.");
      setScreen("home");
    }, GOOGLE_DELAY_MS);
  }

  function openResetSheet() {
    setResetEmail(email.trim() || "user@gmail.com");
    setResetError("");
    setResetStatus("idle");
    setIsResetOpen(true);
  }

  function closeResetSheet() {
    if (isResetSubmitting) return;

    setIsResetOpen(false);
    setResetError("");
    setResetStatus("idle");
  }

  function handleResetSubmit(event) {
    event.preventDefault();

    const normalizedEmail = resetEmail.trim();
    if (!isValidEmail(normalizedEmail)) {
      setResetError("Masukkan email yang valid untuk menerima link reset.");
      return;
    }

    setResetError("");
    setIsResetSubmitting(true);

    schedule(() => {
      setIsResetSubmitting(false);
      setResetStatus("sent");
      showToast("Link reset dikirim", `Instruksi reset password sudah dikirim ke ${normalizedEmail}.`);
    }, RESET_DELAY_MS);
  }

  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#99ECF5_0%,#F7FCFE_18%,#FFFFFF_32%)] text-[#082B5C]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-6 pb-10 pt-8">
        <div className="flex flex-col items-center">
          <BrandMark />
          <div className="mt-3 text-center">
            <div className="text-4xl font-black tracking-tight text-[#082B5C]">
              Focus<span className="text-[#1C9AA0]">Tunes</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">Focus Flow Finish</div>
          </div>
          <div className="mt-3 flex items-end gap-[4px] opacity-40">
            {[8, 14, 20, 26, 32, 26, 20, 14, 8].map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-[#1C9AA0]" style={{ height: h }} />
            ))}
          </div>
        </div>

        <div className="mt-7">
          <h1 className="text-[2.1rem] font-black leading-tight tracking-tight text-[#082B5C]">Masuk ke akun Anda</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk menyimpan preset fokus dan riwayat sesi.</p>
        </div>

        <form className="mt-6" onSubmit={handleLoginSubmit}>
          <div className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="nama@email.com"
              error={fieldErrors.email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((previous) => ({ ...previous, email: "" }));
              }}
            />
            <Field
              label="Password"
              value={password}
              autoComplete="current-password"
              placeholder="Masukkan password"
              secure
              error={fieldErrors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((previous) => ({ ...previous, password: "" }));
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((previous) => !previous)}
                className="sr-only"
              />
              <span
                className={cx(
                  "grid h-4 w-4 place-items-center rounded-[4px] border transition",
                  rememberMe ? "border-[#1C9AA0] bg-[#ECF7F8]" : "border-slate-300 bg-white"
                )}
              >
                {rememberMe ? <Check className="h-3 w-3 text-[#1C9AA0]" /> : null}
              </span>
              Ingat saya
            </label>
            <button type="button" onClick={openResetSheet} className="font-medium text-[#4B76F1]">
              Lupa password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoginLoading || isGoogleLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#265CF2] bg-[#082B5C] px-5 py-4 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoginLoading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Memverifikasi akun...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">Atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoginLoading || isGoogleLoading}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGoogleLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-[#1C9AA0]" /> : <GoogleIcon />}
          {isGoogleLoading ? "Menghubungkan akun Google..." : "Lanjutkan dengan Google"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <button type="button" onClick={() => setScreen("register")} className="font-semibold text-[#1C9AA0]">
            Daftar
          </button>
        </p>
      </div>

      {isResetOpen ? (
        <ResetPasswordSheet
          email={resetEmail}
          error={resetError}
          isSubmitting={isResetSubmitting}
          isSuccess={resetStatus === "sent"}
          onChange={(event) => {
            setResetEmail(event.target.value);
            setResetError("");
          }}
          onClose={closeResetSheet}
          onSubmit={handleResetSubmit}
        />
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  secure = false,
  error = "",
  placeholder = "",
  autoComplete = "off",
}) {
  const [shown, setShown] = useState(false);
  const inputType = secure ? (shown ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#082B5C]">{label}</span>
      <div
        className={cx(
          "flex items-center rounded-2xl border bg-white px-4 py-3 shadow-sm transition",
          error ? "border-rose-300 ring-2 ring-rose-100" : "border-[#C8E8EB] focus-within:border-[#1C9AA0] focus-within:ring-2 focus-within:ring-[#1C9AA0]/10"
        )}
      >
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
        />
        {secure ? (
          <button type="button" onClick={() => setShown((previous) => !previous)} className="ml-2 text-slate-400">
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-rose-500">{error}</p> : null}
    </label>
  );
}

function ResetPasswordSheet({ email, error, isSubmitting, isSuccess, onChange, onClose, onSubmit }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-[#082B5C]/30 px-4 pb-6 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full rounded-[30px] bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black text-[#082B5C]">{isSuccess ? "Cek email Anda" : "Reset password"}</div>
            <p className="mt-1 text-sm text-slate-500">
              {isSuccess ? "Link reset sudah dikirim. Anda bisa kembali ke login setelah mengecek inbox." : "Masukkan email akun untuk menerima link reset password."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="mt-5 rounded-[24px] bg-[#F7FAFC] p-4 ring-1 ring-slate-100">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#082B5C]">Link reset berhasil dibuat</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Instruksi reset password sudah disiapkan untuk <span className="font-semibold text-[#082B5C]">{email}</span>.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#082B5C] px-4 py-3 text-sm font-semibold text-white"
            >
              Kembali ke login
            </button>
          </div>
        ) : (
          <form className="mt-5" onSubmit={onSubmit}>
            <Field
              label="Email akun"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="nama@email.com"
              error={error}
              onChange={onChange}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#082B5C]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#082B5C] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Kirim link
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function validateLoginFields(email, password) {
  const nextErrors = {};

  if (!email.trim()) {
    nextErrors.email = "Email wajib diisi.";
  } else if (!isValidEmail(email)) {
    nextErrors.email = "Format email belum valid.";
  }

  if (!password.trim()) {
    nextErrors.password = "Password wajib diisi.";
  } else if (password.trim().length < 6) {
    nextErrors.password = "Password minimal 6 karakter.";
  }

  return nextErrors;
}

function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}
