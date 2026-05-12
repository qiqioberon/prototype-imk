import { AnimatePresence, motion } from "framer-motion";

import { usePrototype } from "../../context/PrototypeProvider.jsx";

export function PrototypeToast() {
  const { toast, t } = usePrototype();
  const resolve = (key) => {
    const toastKey = `toasts.${key}`;
    const toastValue = t(toastKey, toast?.params);
    if (toastValue !== toastKey) return toastValue;
    const directValue = t(key, toast?.params);
    return directValue === key ? key : directValue;
  };

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute left-4 right-4 top-16 z-40 rounded-[24px] border border-[#CFE6EC] bg-white/96 px-4 py-3 shadow-[0_14px_32px_rgba(8,43,92,0.18)] backdrop-blur"
        >
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1C9AA0]">{resolve(toast.title)}</div>
          <div className="mt-1 text-sm font-medium text-[#082B5C]">{resolve(toast.description)}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
