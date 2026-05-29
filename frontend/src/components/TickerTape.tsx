import { useMarketStore } from '../store/useMarketStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

export const TickerTape = () => {
  const { coins } = useMarketStore();
  
  if (!coins || coins.length === 0) return null;

  // Duplicate coins to create an infinite scroll effect
  const tickerItems = [...coins, ...coins];

  return (
    <div className="w-full bg-[var(--bg-card)] border-b border-[var(--border)] h-10 overflow-hidden flex items-center relative z-10">
      <div className="animate-ticker flex whitespace-nowrap">
        {tickerItems.map((coin, idx) => (
          <div key={`${coin.id}-${idx}`} className="flex items-center space-x-3 px-6 border-r border-white/5">
            <span className="font-bold text-xs text-white uppercase tracking-wider">{coin.symbol}</span>
            <span className="font-mono text-xs text-white">
              ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <div className={clsx("flex items-center text-[10px] font-bold", coin.price_change_percentage_24h >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
              {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
