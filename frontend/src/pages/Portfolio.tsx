import { useEffect } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';
import { Wallet, ArrowUpRight, ArrowDownRight, History, PieChart } from 'lucide-react';
import { formatPrice } from '../hooks/useAssetData';
import { clsx } from 'clsx';
import { Sparkline } from '../components/Sparkline';

export default function Portfolio() {
  const { balance, holdings, transactions, fetchPortfolio, isLoading } = usePortfolioStore();
  const { coins } = useMarketStore();

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Calculate current value of holdings
  let totalHoldingsValue = 0;
  const enrichedHoldings = holdings.map(h => {
    // Try to find real-time price from market store, fallback to last known DB price
    const liveCoin = coins.find(c => c.symbol.toLowerCase() === h.asset.symbol.toLowerCase());
    const currentPrice = liveCoin?.current_price || h.asset.currentPrice;
    const value = h.amount * currentPrice;
    totalHoldingsValue += value;
    
    const pnl = value - (h.amount * h.avgPrice);
    const pnlPercent = (pnl / (h.amount * h.avgPrice)) * 100;

    return { ...h, currentPrice, value, pnl, pnlPercent, image: liveCoin?.image };
  });

  const totalAssets = balance + totalHoldingsValue;
  const startingBalance = 100000;
  const totalPnl = totalAssets - startingBalance;
  const totalPnlPercent = (totalPnl / startingBalance) * 100;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <Wallet className="text-[var(--accent-blue)]" size={36} />
          Danh Mục Đầu Tư
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-medium">Quản lý giao dịch và theo dõi tài sản ảo của bạn.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-[#0f1629] to-[#1a2540] border-[var(--accent-blue)]/30">
          <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Tổng Tài Sản</span>
          <div className="text-4xl font-mono font-black mt-2 text-white">
            ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={clsx("flex items-center gap-1 mt-4 text-sm font-bold", totalPnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
            {totalPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            ${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalPnlPercent > 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
          </div>
        </div>

        <div className="card">
          <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Số Dư Khả Dụng</span>
          <div className="text-3xl font-mono font-black mt-2 text-white">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-[var(--accent-blue)] h-full rounded-full" style={{ width: `${(balance / totalAssets) * 100}%` }} />
          </div>
        </div>

        <div className="card">
          <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Giá Trị Đầu Tư</span>
          <div className="text-3xl font-mono font-black mt-2 text-white">
            ${totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-[var(--accent-cyan)] h-full rounded-full" style={{ width: `${(totalHoldingsValue / totalAssets) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
            <PieChart className="text-[var(--accent-cyan)]" />
            <h2 className="text-xl font-black text-white">Tài sản nắm giữ</h2>
          </div>
          {enrichedHoldings.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)]">
              Chưa có tài sản nào. Hãy vào thị trường để mua!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border)] bg-white/[0.02]">
                    <th className="px-6 py-4">Tài sản</th>
                    <th className="px-6 py-4">Số lượng</th>
                    <th className="px-6 py-4">Giá TB</th>
                    <th className="px-6 py-4">Giá hiện tại</th>
                    <th className="px-6 py-4 text-right">Lãi/Lỗ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {enrichedHoldings.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {h.image ? <img src={h.image} alt={h.asset.symbol} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">{h.asset.symbol.charAt(0)}</div>}
                          <div>
                            <div className="font-black text-white uppercase">{h.asset.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-white">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                      <td className="px-6 py-4 font-mono text-[var(--text-muted)]">${h.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-4 font-mono text-white">${h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-4 text-right">
                        <div className={clsx("font-mono font-bold", h.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
                          {h.pnl > 0 ? '+' : ''}${h.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={clsx("text-xs", h.pnlPercent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]")}>
                          {h.pnlPercent > 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-1 card p-0 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
            <History className="text-[var(--accent-blue)]" />
            <h2 className="text-xl font-black text-white">Lịch sử giao dịch</h2>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1 no-scrollbar">
            {transactions.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-8">Chưa có giao dịch</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-2 h-8 rounded-full", tx.type === 'BUY' ? "bg-[var(--green)]" : "bg-[var(--red)]")} />
                    <div>
                      <div className="font-black text-white uppercase">{tx.type} {tx.asset.symbol}</div>
                      <div className="text-xs text-[var(--text-muted)]">{new Date(tx.timestamp).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white font-bold">{tx.amount}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">@ ${tx.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
