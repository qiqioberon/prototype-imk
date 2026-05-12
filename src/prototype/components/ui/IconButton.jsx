

export function IconButton({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="grid h-9 place-items-center rounded-xl bg-[#F7FAFC] text-slate-500 ring-1 ring-slate-100" aria-label={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
