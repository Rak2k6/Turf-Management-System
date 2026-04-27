import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconBgColor = 'bg-[#10b981]' }: StatCardProps) {
  const changeColors = {
    positive: 'text-[#10b981]',
    negative: 'text-[#ef4444]',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className="bg-card rounded-xl p-4 sm:p-5 md:p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs sm:text-sm mb-1">{title}</p>
          <h3 className="text-2xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2">{value}</h3>
          {change && (
            <p className={`text-xs sm:text-sm ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} bg-opacity-10 p-2 sm:p-3 rounded-lg flex-shrink-0`}>
          <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${iconBgColor.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}
