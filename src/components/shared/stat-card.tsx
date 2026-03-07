interface StatCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, secondaryValue, icon }: StatCardProps) {
  return (
    <div className="surface-panel rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-2">
        <p className="text-3xl font-semibold text-zinc-50">{value}</p>
        {secondaryValue && <p className="text-sm text-slate-400">{secondaryValue}</p>}
      </div>
    </div>
  );
}
