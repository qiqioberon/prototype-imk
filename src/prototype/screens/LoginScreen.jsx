import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { BrandMark, StatusBar } from "../components/layout/index.js";

export function LoginScreen() {
  const { setScreen } = usePrototype();
  return (
    <div className="h-full overflow-hidden bg-[linear-gradient(180deg,#99ECF5_0%,#F7FCFE_18%,#FFFFFF_32%)] text-[#082B5C]">
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

        <div className="mt-6 space-y-4">
          <Field label="Email" value="user@gmail.com" />
          <Field label="Password" value="rahasia123" secure />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <label className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-[4px] border border-[#1C9AA0] bg-[#ECF7F8]">
              <Check className="h-3 w-3 text-[#1C9AA0]" />
            </span>
            Remember me
          </label>
          <button className="font-medium text-[#4B76F1]">Forgot password?</button>
        </div>

        <button
          onClick={() => setScreen("onboarding")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#265CF2] bg-[#082B5C] px-5 py-4 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)]"
        >
          Masuk
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">Atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-700 shadow-sm">
          <GoogleIcon />
          Lanjutkan dengan Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <button onClick={() => setScreen("register")} className="font-semibold text-[#1C9AA0]">
            Daftar
          </button>
        </p>
      </div>
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

function Field({ label, value, secure = false }) {
  const [shown, setShown] = useState(false);
  const displayValue = secure && !shown ? "••••••••" : value;
  return (
    <div className="flex items-center rounded-2xl border border-[#C8E8EB] bg-white px-4 py-3 shadow-sm focus-within:border-[#1C9AA0] focus-within:ring-2 focus-within:ring-[#1C9AA0]/10">
      <div className="flex-1">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="mt-0.5 text-base text-slate-800">{displayValue}</div>
      </div>
      {secure && (
        <button onClick={() => setShown((s) => !s)} className="ml-2 text-slate-400">
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
