import { Badge } from "@/components/ui/badge";
import { homeSections } from "@/lib/homeSections";
import { scrollToHash } from "@/lib/scroll";

export const SectionIndexNav = () => {
  const handleSectionClick = (hash: string) => {
    scrollToHash(hash);
  };

  return (
    <div className="w-full overflow-hidden mb-8">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 min-w-max px-1">
          {homeSections.map((section) => (
            <Badge
              key={section.id}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => handleSectionClick(section.hash)}
            >
              <section.icon className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{section.title}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};