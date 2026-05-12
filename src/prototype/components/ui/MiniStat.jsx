

export function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3 ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-white">{value}</div>
    </div>
  );
}
