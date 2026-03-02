interface StatCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, secondaryValue, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{label}</p>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-zinc-50">{value}</p>
        {secondaryValue && <p className="text-sm text-zinc-400">{secondaryValue}</p>}
      </div>
    </div>
  );
}
