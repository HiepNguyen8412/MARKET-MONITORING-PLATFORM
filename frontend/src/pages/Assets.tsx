import { useState, useEffect } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useMarketData } from '../hooks/useMarketData';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Grid, 
  List, 
  Star,
  Info
} from 'lucide-react';
import { PriceChange } from '../components/PriceChange';
import { Sparkline } from '../components/Sparkline';
import { clsx } from 'clsx';

const formatUSD = (val: number) => {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
};

const Assets = () => {
  useMarketData();
  const { coins, watchlist, toggleWatchlist } = useMarketStore();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'gainers' | 'losers' | 'watchlist'>('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const filteredCoins = coins.filter(coin => {
    const matchesSearch = coin.name.toLowerCase().includes(search.toLowerCase()) || 
                          coin.symbol.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'gainers') return matchesSearch && coin.price_change_percentage_24h > 0;
    if (activeTab === 'losers') return matchesSearch && coin.price_change_percentage_24h < 0;
    if (activeTab === 'watchlist') return matchesSearch && watchlist.includes(coin.id);
    return matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'gainers', label: 'Tăng giá' },
    { id: 'losers', label: 'Giảm giá' },
    { id: 'watchlist', label: 'Theo dõi' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white">Thị trường</h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Danh sách toàn bộ tài sản kỹ thuật số.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-blue)]" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..."
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl py-3 pl-12 pr-6 w-[280px] focus:outline-none focus:border-[var(--accent-blue)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-2xl flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-[var(--accent-blue)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white")}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={clsx("p-2 rounded-xl transition-all", viewMode === 'table' ? "bg-[var(--accent-blue)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white")}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--border)] pb-0.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative",
              activeTab === tab.id ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-blue)] shadow-[0_0_10px_var(--accent-blue)]" />
            )}
          </button>
        ))}
      </div>

      {viewMode === 'table' ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border)]">
                <th className="px-8 py-5">Tài sản</th>
                <th className="px-8 py-5">Giá (USD)</th>
                <th className="px-8 py-5 text-right">Thay đổi 24h</th>
                <th className="px-8 py-5">Vốn hóa</th>
                <th className="px-8 py-5">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(filteredCoins ?? []).map((coin) => (
                <tr key={coin.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-black text-white">{coin.name}</div>
                        <div className="text-[var(--text-muted)] text-xs font-bold uppercase">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-mono font-black text-lg text-white">
                      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <PriceChange value={coin.price_change_percentage_24h} showBadge />
                  </td>
                  <td className="px-8 py-6 text-[var(--text-muted)] font-bold">
                    {formatUSD(coin.market_cap)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => toggleWatchlist(coin.id)} className={clsx("p-2 rounded-xl transition-all", watchlist.includes(coin.id) ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)] hover:text-white")}>
                        <Star size={18} fill={watchlist.includes(coin.id) ? "currentColor" : "none"} />
                      </button>
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-all">
                        <Info size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(filteredCoins ?? []).map(coin => (
            <div key={coin.id} className="card card-hover flex flex-col items-center text-center">
              <div className="flex justify-between w-full mb-4">
                <button onClick={() => toggleWatchlist(coin.id)}>
                  <Star size={18} className={watchlist.includes(coin.id) ? "text-[var(--accent-blue)] fill-current" : "text-[var(--text-muted)]"} />
                </button>
                <PriceChange value={coin.price_change_percentage_24h} />
              </div>
              <img src={coin.image} alt={coin.name} className="w-16 h-16 rounded-full mb-4 shadow-xl" />
              <h3 className="font-black text-white text-lg">{coin.name}</h3>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase mb-4">{coin.symbol}</p>
              <div className="text-2xl font-black text-white font-mono mb-4">
                ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="w-full h-[60px] opacity-50">
                <Sparkline data={coin.sparkline_in_7d.price} color={coin.price_change_percentage_24h >= 0 ? 'var(--green)' : 'var(--red)'} height={50} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assets;
