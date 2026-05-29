import { useState, useEffect, useRef } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useMarketData } from '../hooks/useMarketData';
import { 
  BarChart2, 
  Activity, 
  LayoutGrid, 
  Star,
  Search,
  Lock,
  RefreshCw,
  Bell
} from 'lucide-react';
import { TradingChart } from '../components/TradingChart';
import { useAssetData, ALL_ASSETS, CATEGORIES, formatPrice } from '../hooks/useAssetData';
import { PriceChange } from '../components/PriceChange';
import { Sparkline } from '../components/Sparkline';
import { clsx } from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { Watchlist } from '../components/Watchlist';
import { useAuthStore } from '../store/useAuthStore';
import { SetAlertModal } from '../components/SetAlertModal';

const formatUSD = (val: number) => {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
};

const AssetRow = ({ coin, toggleWatchlist, watchlist, onSetAlert }: any) => {
  const prevPrice = useRef(coin.current_price);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (coin.current_price > prevPrice.current) {
      setFlashClass('flash-up');
      setTimeout(() => setFlashClass(''), 1000);
    } else if (coin.current_price < prevPrice.current) {
      setFlashClass('flash-dn');
      setTimeout(() => setFlashClass(''), 1000);
    }
    prevPrice.current = coin.current_price;
  }, [coin.current_price]);

  return (
    <tr className={clsx("group hover:bg-white/[0.02] transition-colors", flashClass)}>
      <td className="px-8 py-6">
        <Link to={`/asset/${coin.id}`} className="flex items-center space-x-4 hover:opacity-80">
          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
          <div>
            <div className="font-black text-white">{coin.name}</div>
            <div className="text-[var(--text-muted)] text-xs font-bold uppercase">{coin.symbol}</div>
          </div>
        </Link>
      </td>
      <td className="px-8 py-6">
        <div className="font-mono font-black text-lg text-white">
          ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <PriceChange value={coin.price_change_percentage_24h} showBadge />
      </td>
      <td className="px-8 py-6">
        <div className="text-sm font-bold text-[var(--text-muted)]">
          {formatUSD(coin.market_cap)}
        </div>
      </td>
      <td className="px-8 py-6">
        <Sparkline 
          data={coin.sparkline_in_7d?.price || []} 
          color={coin.price_change_percentage_24h >= 0 ? 'var(--green)' : 'var(--red)'} 
          height={30}
          isPositive={coin.price_change_percentage_24h >= 0}
        />
      </td>
      <td className="px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onSetAlert(coin.symbol);
            }}
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-400 hover:border-orange-400 transition-all"
            title="Set Price Alert"
          >
            <Bell size={18} />
          </button>
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if (!useAuthStore.getState().token) {
                alert('Vui lòng đăng nhập để thêm tài sản vào danh sách theo dõi!');
                return;
              }
              toggleWatchlist(coin.id); 
            }}
            className={clsx(
              "p-2 rounded-xl border border-[var(--border)] transition-all",
              watchlist.includes(coin.id) 
                ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white shadow-lg" 
                : "text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)]"
            )}
          >
            <Star size={18} fill={watchlist.includes(coin.id) ? "currentColor" : "none"} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const Dashboard = () => {
  const { refresh } = useMarketData();
  const { 
    coins, 
    globalData, 
    watchlist, 
    toggleWatchlist,
    isLoading: isGlobalLoading,
    isError,
    errorStatus,
    lastUpdated
  } = useMarketStore();

  // New multi-asset states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chartVisible, setChartVisible] = useState(true);
  
  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertDefaultAsset, setAlertDefaultAsset] = useState<number | undefined>();
  const { availableAssets, fetchAvailableAssets } = useWatchlistStore();

  useEffect(() => {
    fetchAvailableAssets();
  }, [fetchAvailableAssets]);

  const handleOpenAlertModal = (symbol?: string) => {
    if (!useAuthStore.getState().token) {
      alert('Vui lòng đăng nhập để đặt cảnh báo giá!');
      return;
    }
    
    if (symbol && availableAssets.length > 0) {
      const asset = availableAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
      if (asset) setAlertDefaultAsset(asset.id);
    }
    
    setIsAlertModalOpen(true);
  };

  // Filtered assets based on category
  const visibleAssets = activeCategory === 'all' 
    ? ALL_ASSETS 
    : ALL_ASSETS.filter(a => a.category === activeCategory);

  const currentAsset = isLocked 
    ? ALL_ASSETS.find(a => a.id === activeAssetId) 
    : visibleAssets[autoIndex];

  const { data: chartData, quote, loading: isChartLoading, error: isChartError, source } = useAssetData(currentAsset);

  // Auto-rotate logic across visible assets
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setAutoIndex(prev => (prev + 1) % visibleAssets.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isLocked, visibleAssets.length]);

  // Reset autoIndex when category changes
  useEffect(() => {
    setAutoIndex(0);
  }, [activeCategory]);

  // Progress bar logic
  useEffect(() => {
    if (isLocked) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 8000;
      if (elapsed >= 1) { 
        clearInterval(tick); 
        setProgress(0); 
      } else {
        setProgress(elapsed * 100);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [autoIndex, isLocked]);

  // Chart fade transition
  useEffect(() => {
    if (isChartLoading) {
      setChartVisible(false);
    } else {
      const timer = setTimeout(() => setChartVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isChartLoading]);

  const handleSelectAsset = (assetId: string) => {
    setActiveAssetId(assetId);
    setIsLocked(true);
  };

  const handleAutoMode = () => {
    setActiveAssetId(null);
    setIsLocked(false);
  };

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = coins.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const currentColor = currentAsset?.color ?? '#06b6d4';

  const topGainer = coins.length > 0 ? coins.reduce((prev, current) => (prev.price_change_percentage_24h > current.price_change_percentage_24h) ? prev : current) : null;
  const topLoser = coins.length > 0 ? coins.reduce((prev, current) => (prev.price_change_percentage_24h < current.price_change_percentage_24h) ? prev : current) : null;
  const gainersCount = coins.filter(c => c.price_change_percentage_24h > 0).length;
  const sentimentScore = coins.length > 0 ? Math.round((gainersCount / coins.length) * 100) : 50;

  const stats = [
    { 
      label: 'Top Gainer', 
      value: topGainer ? topGainer.symbol.toUpperCase() : '-', 
      icon: Activity, 
      color: 'var(--green)',
      trend: topGainer ? topGainer.price_change_percentage_24h : 0
    },
    { 
      label: 'Top Loser', 
      value: topLoser ? topLoser.symbol.toUpperCase() : '-', 
      icon: BarChart2, 
      color: 'var(--red)',
      trend: topLoser ? topLoser.price_change_percentage_24h : 0
    },
    { 
      label: 'Tâm lý thị trường', 
      value: `${sentimentScore}% Bullish`, 
      icon: LayoutGrid, 
      color: sentimentScore >= 50 ? 'var(--green)' : 'var(--red)',
      trend: sentimentScore - 50
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white">
            Thị trường <span className="text-[var(--accent-blue)]">Trực tuyến</span>
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Theo dõi biến động giá tài sản theo thời gian thực.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-blue)] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tài sản (BTC, ETH, AA...)"
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl py-3 pl-12 pr-6 w-[320px] focus:outline-none focus:border-[var(--accent-blue)] transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          />
          {showSearch && search && (
            <div className="absolute top-full left-0 w-full bg-[var(--bg-card)] border border-[var(--border)] mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {searchResults.map(coin => (
                <Link 
                  key={coin.id}
                  to={`/assets?search=${coin.symbol}`}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-sm text-white">{coin.name}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{coin.symbol}</span>
                </Link>
              ))}
              {searchResults.length === 0 && (
                <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Không tìm thấy tài sản</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card group hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-white/5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" style={{ color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <PriceChange value={stat.trend} showBadge />
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
              <div className="text-3xl font-black mt-1 text-white">{stat.value}</div>
            </div>
            <div className="mt-6 opacity-30 group-hover:opacity-100 transition-opacity">
              <Sparkline data={[10, 15, 8, 12, 18, 14, 20]} color={stat.color} height={30} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="card relative overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-6 w-full max-w-[70%]">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                Chỉ số thị trường
                <div className="px-2 py-0.5 rounded text-[10px] bg-[var(--accent-blue)] text-white uppercase tracking-widest">Live</div>
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Theo dõi biến động đa tài sản toàn cầu</p>
            </div>

            {/* Category Filter Bar */}
            <div className="flex items-center gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setIsLocked(false); }}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                    activeCategory === cat.id
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-[var(--text-muted)] hover:text-white"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex flex-col">
              {/* Asset Tabs (Scrollable) */}
              <div 
                className="flex items-center gap-2 bg-white/5 p-1 rounded-full w-full border border-white/5 overflow-x-auto no-scrollbar"
                style={{ scrollbarWidth: 'none' }}
              >
                <button
                  onClick={handleAutoMode}
                  className={clsx(
                    "flex items-center space-x-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap sticky left-0 z-10",
                    !isLocked 
                      ? "bg-[var(--accent-blue)] text-white shadow-lg" 
                      : "bg-[#0f1629] text-[var(--text-muted)] hover:text-white"
                  )}
                >
                  <RefreshCw size={12} className={!isLocked ? "animate-spin-slow" : ""} />
                  <span>Tự động</span>
                </button>

                {visibleAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelectAsset(asset.id)}
                    className={clsx(
                      "flex items-center space-x-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                      currentAsset?.id === asset.id && isLocked
                        ? "bg-white/10 text-white border border-white/10"
                        : currentAsset?.id === asset.id 
                          ? "text-white"
                          : "text-[var(--text-muted)] hover:text-white"
                    )}
                    style={currentAsset?.id === asset.id ? { color: asset.color } : {}}
                  >
                    {asset.category === 'crypto' ? (
                      <img
                        src={coins.find(c => c.id === asset.id)?.image || `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`}
                        className="w-3.5 h-3.5 rounded-full"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    ) : (
                      <span className="text-xs">{asset.icon}</span>
                    )}
                    <span>{asset.label}</span>
                    {isLocked && activeAssetId === asset.id && <Lock size={10} className="ml-1 opacity-50" />}
                  </button>
                ))}
              </div>
              
              {!isLocked && (
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden mt-2 w-full max-w-[300px]">
                  <div
                    className="h-full rounded-full transition-all duration-75 ease-linear"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: currentColor,
                      boxShadow: `0 0 10px ${currentColor}80`
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Top Right Badge */}
          <div className="flex flex-col items-end">
            {currentAsset && (
              <div 
                className="flex items-center space-x-4 bg-[#0f1629] px-5 py-4 rounded-3xl border shadow-2xl transition-all duration-500"
                style={{ borderColor: `${currentColor}30` }}
              >
                <div className="text-2xl">{currentAsset.icon || (coins.find(c => c.id === currentAsset.id) && <img src={coins.find(c => c.id === currentAsset.id)?.image} className="w-8 h-8 rounded-full" />)}</div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-white text-lg">{currentAsset.label}</span>
                    {quote && <PriceChange value={quote.change24h} showBadge />}
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                    {quote ? formatPrice(quote.price, quote.currency, currentAsset.category) : 'Đang tải...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isChartLoading && chartData.length === 0 ? (
          <div className="animate-pulse bg-gradient-to-r from-[#0f1629] via-[#1a2540] to-[#0f1629] rounded-3xl h-[220px]" />
        ) : (
          <div className="h-[220px] w-full" style={{ opacity: chartVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {isChartError ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                <p className="font-bold">Dữ liệu không khả dụng</p>
                <p className="text-[10px] mt-1 opacity-50 uppercase tracking-widest">{isChartError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[var(--accent-blue)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <TradingChart data={chartData ?? []} />
            )}
          </div>
        )}

        {(!isChartLoading && !isChartError) && (
          <div className="absolute bottom-4 right-8 flex items-center space-x-2">
            <div className={clsx(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              source === 'live' ? "bg-[var(--green)]" : source === 'cached' ? "bg-[var(--accent-blue)]" : "bg-orange-500"
            )} />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              {source === 'live' ? 'Dữ liệu trực tiếp' : source === 'cached' ? 'Dữ liệu đệm' : 'Dữ liệu mô phỏng'}
            </span>
          </div>
        )}

        {(isError && errorStatus === 429) && (
          <div className="absolute bottom-4 right-8 bg-[var(--red)]/10 border border-[var(--red)]/30 px-3 py-1 rounded-full flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--red)]">
              Dữ liệu cache • cập nhật lúc {new Date(lastUpdated).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
            </span>
          </div>
        )}
      </div>

      <Watchlist />

      {/* Asset Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-[var(--border)]">
          <h2 className="text-xl font-black text-white">Danh sách tài sản</h2>
          <Link to="/assets" className="text-[var(--accent-blue)] font-bold text-sm hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border)]">
                <th className="px-8 py-5">Tài sản</th>
                <th className="px-8 py-5">Giá (USD)</th>
                <th className="px-8 py-5 text-right">Thay đổi 24h</th>
                <th className="px-8 py-5">Vốn hóa</th>
                <th className="px-8 py-5">7 Ngày</th>
                <th className="px-8 py-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(coins ?? []).slice(0, 10).map((coin) => (
                <AssetRow key={coin.id} coin={coin} toggleWatchlist={toggleWatchlist} watchlist={watchlist} onSetAlert={handleOpenAlertModal} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SetAlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
        defaultAssetId={alertDefaultAsset} 
      />
    </div>
  );
};

export default Dashboard;
