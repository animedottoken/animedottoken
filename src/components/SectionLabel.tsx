import { LucideIcon } from "lucide-react";

interface SectionLabelProps {
  icon: LucideIcon;
  title: string;
}

export const SectionLabel = ({ icon: Icon, title }: SectionLabelProps) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
};