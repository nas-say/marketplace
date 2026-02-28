import { Badge } from "@/components/ui/badge";

interface TechStackBadgesProps {
  stack: string[];
  max?: number;
}

export function TechStackBadges({ stack, max = 3 }: TechStackBadgesProps) {
  const visible = stack.slice(0, max);
  const remaining = stack.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tech) => (
        <Badge key={tech} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
          {tech}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
