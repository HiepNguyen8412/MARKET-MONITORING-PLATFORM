import React, { useEffect, useState } from 'react';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { Trash2, Plus, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

export const Watchlist = () => {
  const { items, availableAssets, isLoading, error, fetchWatchlist, fetchAvailableAssets, addAsset, removeAsset, connectSocket, disconnectSocket } = useWatchlistStore();
  const { token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    if (token) {
      fetchWatchlist();
      fetchAvailableAssets();
      connectSocket();
    } else {
      fetchAvailableAssets(); // Just to power the search if we wanted
    }
    
    return () => {
      if (token) disconnectSocket();
    };
  }, [fetchWatchlist, fetchAvailableAssets, connectSocket, disconnectSocket, token]);

  const searchResults = availableAssets.filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.symbol?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleAdd = async (assetId: number) => {
    if (!token) {
      setAuthPrompt(true);
      setSearch('');
      setShowSearch(false);
      setTimeout(() => setAuthPrompt(false), 3000);
      return;
    }
    // Check if already in watchlist
    if (items.some(item => item.assetId === assetId)) return;
    
    await addAsset(assetId);
    setSearch('');
    setShowSearch(false);
  };

  const handleRemove = async (id: number) => {
    if (!token) {
      setAuthPrompt(true);
      setTimeout(() => setAuthPrompt(false), 3000);
      return;
    }
    await removeAsset(id);
  };

  // Default display for non-logged in users
  const displayItems = token ? items : [
    { id: 991, assetId: 1, asset: { id: 1, symbol: 'BTC', name: 'Bitcoin', currentPrice: 65000 } },
    { id: 992, assetId: 4, asset: { id: 4, symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 175 } }
  ];

  return (
    <div className="card w-full mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-white">Your Watchlist</h2>
        
        <div className="relative">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-3 py-1">
            <Plus size={16} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Add asset..."
              className="bg-transparent border-none focus:outline-none text-sm text-white px-2 py-1 w-40"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          
          {showSearch && search.length > 0 && (
            <div className="absolute top-full right-0 w-64 bg-gray-800 border border-gray-700 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden">
              {searchResults.map(asset => (
                <button 
                  key={asset.id}
                  onClick={() => handleAdd(asset.id)}
                  className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <span className="font-bold text-sm text-white">{asset.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-2">{asset.symbol}</span>
                  </div>
                  <Plus size={14} className="text-blue-400" />
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="px-4 py-3 text-xs text-gray-400">No assets found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {authPrompt && (
        <div className="bg-orange-500/10 border border-orange-500 text-orange-400 p-3 rounded mb-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} /> <span>Please login to manage your watchlist.</span>
          </div>
          <Link to="/login" className="px-3 py-1 bg-orange-500 text-white rounded font-bold uppercase tracking-wider text-[10px] hover:bg-orange-600 transition-colors">
            Login
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4 flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader size={24} className="text-blue-400 animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center p-8 text-gray-400">
          <p>Your watchlist is empty.</p>
          <p className="text-sm mt-1">Search and add assets to track them in real-time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border)]">
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Current Price</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-bold text-white">{item.asset?.name || item.assetId}</div>
                        <div className="text-[var(--text-muted)] text-xs font-bold uppercase">{item.asset?.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-mono font-bold text-white">
                      ${item.asset?.currentPrice?.toLocaleString() || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
