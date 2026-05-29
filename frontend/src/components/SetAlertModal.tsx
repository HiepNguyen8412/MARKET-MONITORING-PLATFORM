import React, { useState, useEffect } from 'react';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useAlertStore } from '../store/useAlertStore';
import { X, Bell } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAssetId?: number;
}

export const SetAlertModal: React.FC<Props> = ({ isOpen, onClose, defaultAssetId }) => {
  const { availableAssets, fetchAvailableAssets } = useWatchlistStore();
  const { addAlert } = useAlertStore();
  
  const [assetId, setAssetId] = useState<number>(defaultAssetId || 0);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [type, setType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && availableAssets.length === 0) {
      fetchAvailableAssets();
    }
  }, [isOpen, availableAssets.length, fetchAvailableAssets]);

  useEffect(() => {
    if (defaultAssetId) setAssetId(defaultAssetId);
    else if (availableAssets.length > 0 && assetId === 0) setAssetId(availableAssets[0].id);
  }, [defaultAssetId, availableAssets, assetId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!assetId || !targetPrice || isNaN(Number(targetPrice))) {
      setError('Please select an asset and enter a valid target price.');
      return;
    }

    setIsLoading(true);
    try {
      await addAlert(assetId, parseFloat(targetPrice), type);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create alert');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md bg-[#0f1629] border border-[var(--border)] relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] rounded-lg">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Set Price Alert</h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Get notified instantly</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Asset</label>
            <select 
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            >
              {availableAssets.map(asset => (
                <option key={asset.id} value={asset.id} className="bg-gray-800">
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Condition</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as 'ABOVE' | 'BELOW')}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              >
                <option value="ABOVE" className="bg-gray-800">Rises Above (≥)</option>
                <option value="BELOW" className="bg-gray-800">Drops Below (≤)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Price ($)</label>
              <input 
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 65000"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[var(--accent-blue)] hover:bg-blue-600 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>
    </div>
  );
};
