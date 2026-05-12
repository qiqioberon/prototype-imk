

export function FeaturePill({ icon: Icon, title, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <Icon className="h-4 w-4 text-[#1C9AA0]" />
      <div className="mt-2 text-sm font-semibold text-[#082B5C]">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}
