import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { cx } from "../lib/format.js";
import { BrandMark, StatusBar } from "../components/layout/index.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_DELAY_MS = 850;

export function RegisterScreen() {
  const { setScreen, showToast, t } = usePrototype();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateRegisterFields({ fullName, email, password, confirmPassword }, t);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showToast("register.incompleteToastTitle", "register.incompleteToastDescription");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      showToast("register.successToastTitle", "register.successToastDescription");
      setScreen("onboarding");
    }, REGISTER_DELAY_MS);
  }

  return (
    <div className="h-full overflow-hidden bg-[linear-gradient(180deg,#E6F8FB_0%,#F7FCFE_24%,#FFFFFF_42%)] text-[#082B5C]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-6 pb-10 pt-8">
        <button
          type="button"
          onClick={() => setScreen("login")}
          aria-label={t("register.backToLogin")}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#082B5C] shadow-sm ring-1 ring-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mt-5 flex items-center gap-4">
          <BrandMark small />
          <div>
            <div className="text-3xl font-black tracking-tight text-[#082B5C]">
              {t("register.titleStart")} <span className="text-[#1C9AA0]">FocusTunes</span>{t("register.titleEnd")}
            </div>
            <p className="mt-1 text-sm text-slate-600">{t("register.description")}</p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field
            label={t("register.fullName")}
            value={fullName}
            placeholder={t("register.fullNamePlaceholder")}
            error={errors.fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              setErrors((previous) => ({ ...previous, fullName: "" }));
            }}
          />
          <Field
            label={t("login.email")}
            type="email"
            value={email}
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((previous) => ({ ...previous, email: "" }));
            }}
          />
          <Field
            label={t("login.password")}
            value={password}
            autoComplete="new-password"
            placeholder={t("register.passwordPlaceholder")}
            secure
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((previous) => ({ ...previous, password: "" }));
            }}
          />
          <Field
            label={t("register.confirmPassword")}
            value={confirmPassword}
            autoComplete="new-password"
            placeholder={t("register.confirmPasswordPlaceholder")}
            secure
            error={errors.confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((previous) => ({ ...previous, confirmPassword: "" }));
            }}
          />

          <div className="rounded-[24px] bg-[#F7FAFC] px-4 py-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-100">
            {t("register.helper")}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#265CF2] bg-[#082B5C] px-5 py-4 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                {t("register.submitting")}
              </>
            ) : (
              <>
                {t("register.submit")}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("register.hasAccount")}{" "}
          <button type="button" onClick={() => setScreen("login")} className="font-semibold text-[#1C9AA0]">
            {t("login.login")}
          </button>
        </p>
      </div>
    </div>
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

function validateRegisterFields({ fullName, email, password, confirmPassword }, t) {
  const nextErrors = {};

  if (!fullName.trim()) {
    nextErrors.fullName = t("register.fullNameRequired");
  }

  if (!email.trim()) {
    nextErrors.email = t("login.emailRequired");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    nextErrors.email = t("login.emailInvalid");
  }

  if (!password.trim()) {
    nextErrors.password = t("login.passwordRequired");
  } else if (password.trim().length < 6) {
    nextErrors.password = t("login.passwordMinLength");
  }

  if (!confirmPassword.trim()) {
    nextErrors.confirmPassword = t("register.confirmPasswordRequired");
  } else if (confirmPassword !== password) {
    nextErrors.confirmPassword = t("register.confirmPasswordMismatch");
  }

  return nextErrors;
}
