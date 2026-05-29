import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PriceChangeProps {
  value: number;
  className?: string;
  showBadge?: boolean;
}

export const PriceChange = ({ value, className, showBadge = false }: PriceChangeProps) => {
  const isPositive = value >= 0;
  
  const content = (
    <div className={clsx(
      "flex items-center font-bold",
      isPositive ? "text-[var(--green)]" : "text-[var(--red)]",
      className
    )}>
      {isPositive ? <ArrowUpRight size={16} className="mr-0.5" /> : <ArrowDownRight size={16} className="mr-0.5" />}
      <span>{Math.abs(value).toFixed(2)}%</span>
    </div>
  );

  if (showBadge) {
    return (
      <div className={clsx(
        "px-2 py-1 rounded-lg text-xs",
        isPositive ? "bg-[var(--green)]/10" : "bg-[var(--red)]/10"
      )}>
        {content}
      </div>
    );
  }

  return content;
};
