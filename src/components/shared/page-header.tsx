interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

export function PageHeader({ title, description, eyebrow = "SideFlip" }: PageHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-400">{description}</p>}
    </div>
  );
}
