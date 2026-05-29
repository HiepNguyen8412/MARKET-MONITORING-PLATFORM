import React, { useEffect } from 'react';
import { useAlertStore } from '../store/useAlertStore';
import { Bell, Trash2, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

const Alerts = () => {
  const { items, isLoading, fetchAlerts, removeAlert, connectSocket, disconnectSocket } = useAlertStore();

  useEffect(() => {
    fetchAlerts();
    connectSocket();
    
    return () => {
      disconnectSocket();
    };
  }, [fetchAlerts, connectSocket, disconnectSocket]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white">
            Price <span className="text-[var(--accent-blue)]">Alerts</span>
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Manage your custom threshold notifications.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <Bell size={20} className="text-[var(--accent-blue)]" /> Active Alerts
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Loading alerts...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">
            No alerts set. Go to the dashboard to set price alerts for assets you track.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map(alert => (
              <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 w-48">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-black text-lg text-white">
                      {alert.asset.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{alert.asset.symbol}</div>
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        Current: ${alert.asset.currentPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    {alert.type === 'ABOVE' ? (
                      <TrendingUp size={16} className="text-green-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                    <span className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-widest">
                      {alert.type === 'ABOVE' ? 'Rises Above' : 'Drops Below'}
                    </span>
                    <span className="font-black text-white text-lg ml-2">
                      ${alert.targetPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                    alert.status === 'TRIGGERED' ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                  )}>
                    {alert.status === 'TRIGGERED' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {alert.status}
                  </div>
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                    title="Delete Alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
