

export function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-black uppercase tracking-tight text-[#111827]">{title}</h3>
      {action ? (
        <button onClick={onAction} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {action}
        </button>
      ) : null}
    </div>
  );
}
