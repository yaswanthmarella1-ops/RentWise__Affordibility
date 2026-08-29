import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Users,
  RefreshCw
} from 'lucide-react';
import { Currency, CustomRoommate, formatCurrency, formatPercent } from '@rentwise/shared';

interface CustomSplitProps {
  totalHousingCost: number;
  totalRent: number;
  totalUtilities: number;
  initialPeopleCount: number;
  currency: Currency;
}

export const CustomSplit: React.FC<CustomSplitProps> = ({
  totalHousingCost,
  totalRent,
  totalUtilities,
  initialPeopleCount,
  currency,
}) => {
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [roommates, setRoommates] = useState<CustomRoommate[]>([]);
  const [copied, setCopied] = useState(false);

  // Sync roommates whenever initialPeopleCount changes if in equal mode or initially
  useEffect(() => {
    const count = Math.max(1, initialPeopleCount);
    const equalShare = 100 / count;
    
    setRoommates((prev) => {
      // If we already have roommates with names, preserve them or adapt length
      const newArr: CustomRoommate[] = [];
      for (let i = 0; i < count; i++) {
        const existing = prev[i];
        newArr.push({
          id: existing?.id || `roommate-${i + 1}`,
          name: existing?.name || (i === 0 ? 'You' : `Roommate ${i + 1}`),
          sharePercent: splitMode === 'equal' ? Number(equalShare.toFixed(1)) : (existing?.sharePercent || Number(equalShare.toFixed(1))),
          customAmount: (totalHousingCost * (splitMode === 'equal' ? equalShare : (existing?.sharePercent || equalShare))) / 100,
          roomType: existing?.roomType || (i === 0 ? 'Master Bedroom' : 'Standard Room'),
        });
      }
      return newArr;
    });
  }, [initialPeopleCount, splitMode, totalHousingCost]);

  // Calculate sum of percentages
  const totalPercentage = roommates.reduce((sum, r) => sum + (r.sharePercent || 0), 0);
  const roundedTotalPct = Number(totalPercentage.toFixed(1));
  const isPercentageValid = Math.abs(roundedTotalPct - 100) < 0.2;
  const pctDiff = Number((100 - roundedTotalPct).toFixed(1));

  const handlePercentChange = (id: string, newPct: number) => {
    setRoommates((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              sharePercent: newPct,
              customAmount: (totalHousingCost * newPct) / 100,
            }
          : r
      )
    );
  };

  const handleNameChange = (id: string, newName: string) => {
    setRoommates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  };

  const handleRoomTypeChange = (id: string, newType: string) => {
    setRoommates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, roomType: newType } : r))
    );
  };

  const handleAddRoommate = () => {
    const newCount = roommates.length + 1;
    const newRoommate: CustomRoommate = {
      id: `roommate-${Date.now()}`,
      name: `Roommate ${newCount}`,
      sharePercent: 0,
      customAmount: 0,
      roomType: 'Standard Room',
    };
    setRoommates([...roommates, newRoommate]);
  };

  const handleRemoveRoommate = (id: string) => {
    if (roommates.length <= 1) return;
    setRoommates(roommates.filter((r) => r.id !== id));
  };

  const handleAutoBalance = () => {
    const count = roommates.length;
    if (count === 0) return;
    const equalShare = Number((100 / count).toFixed(1));
    setRoommates(
      roommates.map((r, idx) => ({
        ...r,
        sharePercent: idx === count - 1 ? Number((100 - equalShare * (count - 1)).toFixed(1)) : equalShare,
        customAmount: (totalHousingCost * equalShare) / 100,
      }))
    );
  };

  // Preset weighting: Master Room (40%), Standard (30%), Standard (30%) or based on room amenities
  const handleApplyPresetSplit = (type: 'master-premium' | 'equal' | 'size-based') => {
    const count = roommates.length;
    if (count < 2) return;

    if (type === 'master-premium') {
      if (count === 2) {
        setRoommates([
          { ...roommates[0], sharePercent: 55, customAmount: (totalHousingCost * 55) / 100, roomType: 'Master with Bath' },
          { ...roommates[1], sharePercent: 45, customAmount: (totalHousingCost * 45) / 100, roomType: 'Standard Room' },
        ]);
      } else if (count === 3) {
        setRoommates([
          { ...roommates[0], sharePercent: 40, customAmount: (totalHousingCost * 40) / 100, roomType: 'Master with Bath' },
          { ...roommates[1], sharePercent: 30, customAmount: (totalHousingCost * 30) / 100, roomType: 'Standard Room' },
          { ...roommates[2], sharePercent: 30, customAmount: (totalHousingCost * 30) / 100, roomType: 'Standard Room' },
        ]);
      } else {
        const masterShare = 35;
        const remainder = (100 - masterShare) / (count - 1);
        setRoommates(
          roommates.map((r, idx) => ({
            ...r,
            sharePercent: idx === 0 ? masterShare : Number(remainder.toFixed(1)),
            customAmount: (totalHousingCost * (idx === 0 ? masterShare : remainder)) / 100,
            roomType: idx === 0 ? 'Master Suite' : 'Standard Room',
          }))
        );
      }
    } else {
      handleAutoBalance();
    }
  };

  const handleCopySummary = () => {
    const lines = [
      `🏠 *RentWise Split Breakdown*`,
      `Total Housing Cost: ${formatCurrency(totalHousingCost, currency)}/mo`,
      `Rent: ${formatCurrency(totalRent, currency)} | Utilities: ${formatCurrency(totalUtilities, currency)}`,
      `---------------------------------`,
      ...roommates.map(
        (r) =>
          `• *${r.name}* (${r.roomType || 'Room'} - ${r.sharePercent}%): ${formatCurrency((totalHousingCost * r.sharePercent) / 100, currency)}/mo`
      ),
      `---------------------------------`,
      `Calculated via RentWise App 🚀`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="custom-split" className="py-12 scroll-mt-20">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        {/* Section Header & Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Advanced Custom Split
              </h3>
              <p className="text-xs text-slate-500">
                Split total costs equally or assign custom percentages by room size and master bedroom
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                setSplitMode('equal');
                handleAutoBalance();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                splitMode === 'equal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-brand-600" />
              Equal Split
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                splitMode === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-brand-600" />
              Custom / Weighted
            </button>
          </div>
        </div>

        {/* Custom Split Preset Presets Bar */}
        {splitMode === 'custom' && (
          <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPresetSplit('master-premium')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              >
                Master Bedroom Premium
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetSplit('equal')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              >
                Reset Equal Shares
              </button>
            </div>

            <button
              type="button"
              onClick={handleAutoBalance}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 hover:underline ml-auto"
            >
              <RefreshCw className="w-3 h-3" /> Auto-balance to 100%
            </button>
          </div>
        )}

        {/* Validation Banner if Custom Split does not add up to 100% */}
        {splitMode === 'custom' && (
          <div
            className={`mb-6 p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
              isPercentageValid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isPercentageValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <div>
                <strong>Total Allocated: {roundedTotalPct}% / 100%</strong>
                {!isPercentageValid && (
                  <span className="block sm:inline sm:ml-2">
                    {pctDiff > 0
                      ? `(${pctDiff}% unallocated remaining)`
                      : `(${Math.abs(pctDiff)}% over-allocated)`}
                  </span>
                )}
              </div>
            </div>

            {!isPercentageValid && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-xs"
              >
                Auto-Fix to 100%
              </button>
            )}
          </div>
        )}

        {/* Roommate Rows List */}
        <div className="space-y-3 mb-6">
          {roommates.map((r, index) => {
            const calculatedAmount = (totalHousingCost * (r.sharePercent || 0)) / 100;

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                {/* Left: Name and Room type */}
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => handleNameChange(r.id, e.target.value)}
                      placeholder={`Roommate ${index + 1}`}
                      className="w-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <select
                      value={r.roomType || 'Standard Room'}
                      onChange={(e) => handleRoomTypeChange(r.id, e.target.value)}
                      className="text-[11px] text-slate-500 bg-transparent focus:outline-none font-medium"
                    >
                      <option value="Master with Bath">Master Bedroom with Ensuite</option>
                      <option value="Master Room">Master Bedroom</option>
                      <option value="Standard Room">Standard Room</option>
                      <option value="Small / Single Room">Small / Single Room</option>
                      <option value="Twin-Sharing">Twin-Sharing Bed</option>
                    </select>
                  </div>
                </div>

                {/* Middle: Percentage Control */}
                <div className="flex items-center gap-3 sm:w-64">
                  {splitMode === 'custom' ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Share %</span>
                        <span className="font-bold text-slate-900">{r.sharePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={r.sharePercent || 0}
                        onChange={(e) => handlePercentChange(r.id, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      Equal Share ({formatPercent(100 / roommates.length, 1)})
                    </div>
                  )}
                </div>

                {/* Right: Calculated Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Monthly Share
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(calculatedAmount, currency)}
                    </div>
                  </div>

                  {splitMode === 'custom' && roommates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoommate(r.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove roommate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions: Add Roommate & Copy WhatsApp message */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {splitMode === 'custom' && (
            <button
              type="button"
              onClick={handleAddRoommate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Add Another Roommate</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-brand-600 transition-all shadow-sm active:scale-95 ml-auto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Split Summary for Roommates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
