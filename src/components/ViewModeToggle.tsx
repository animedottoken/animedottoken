import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { useViewMode, ViewMode } from '@/contexts/ViewModeContext';
import { Eye, FileText } from 'lucide-react';

const ViewModeToggle: React.FC = () => {
  const { viewMode, setViewMode } = useViewMode();

  const modes: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'full', label: 'Full Details', icon: FileText },
  ];

  return (
    <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm rounded-lg p-1 border border-border/50">
      {modes.map(({ key, label, icon: Icon }) => (
        <Toggle
          key={key}
          pressed={viewMode === key}
          onPressedChange={() => setViewMode(key)}
          variant="outline"
          size="sm"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground gap-2 text-xs"
          aria-label={`Switch to ${label} view mode`}
          title={`${label}: ${
            key === 'overview' ? 'Shows only headlines and subheadlines' :
            'Expands all sections to show complete information'
          }`}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{label}</span>
        </Toggle>
      ))}
    </div>
  );
};

export default ViewModeToggle;