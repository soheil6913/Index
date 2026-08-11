import React, { useState } from 'react';
import { ScanRecord } from '../types';
import {
  History,
  Search,
  Trash2,
  Box,
  Sparkles,
  Download,
  Calendar,
  Layers,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';

interface HistoryTabProps {
  scans: ScanRecord[];
  onLoadScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onNavigateToAiWithScan: (scan: ScanRecord) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  scans,
  onLoadScan,
  onDeleteScan,
  onNavigateToAiWithScan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSoilFilter, setSelectedSoilFilter] = useState<string>('all');

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scan.notes && scan.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSoil = selectedSoilFilter === 'all' || scan.soilType.includes(selectedSoilFilter);
    return matchesSearch && matchesSoil;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              تاریخچه اسکن‌های ذخیره‌شده (Scan Archive)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده، بازخوانی پروژه‌های قبلی در نمای ۳بعدی و آنالیز زمین
          </p>
        </div>

        <div className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl">
          {scans.length} پروژه اسکن موجود
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام پروژه یا یادداشت..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
          />
        </div>

        {/* Soil Filter */}
        <select
          value={selectedSoilFilter}
          onChange={(e) => setSelectedSoilFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-amber-400 outline-none"
        >
          <option value="all">همه خاک‌ها</option>
          <option value="کشاورزی">خاک کشاورزی</option>
          <option value="معدنی">خاک معدنی</option>
          <option value="سنگ">سنگ و صخره</option>
        </select>
      </div>

      {/* Scans Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredScans.map((scan) => {
          // Compute peak ADC for badge
          let peak = 0;
          scan.gridData.forEach((v) => {
            if (v > peak) peak = v;
          });

          return (
            <div
              key={scan.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-400/40 rounded-2xl p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                
                {/* Title & Date */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                      {scan.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{scan.date}</span>
                    </div>
                  </div>

                  {peak > 750 ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-400/15 text-amber-300 border border-amber-400/30 rounded-lg">
                      🎯 پیک فلزی بالا
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg">
                      اسکن معمولی
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-300">
                    شبکه: <span className="text-cyan-400 font-bold">{scan.width}×{scan.length}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-300">
                    عمق: <span className="text-amber-400 font-bold">{scan.maxDepthMeters}m</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-300">
                    خاک: <span className="text-emerald-400 font-bold">{scan.soilType.split(' ')[0]}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-300">
                    مختصات: <span className="text-amber-400 font-bold">{scan.coordinates ? `${scan.coordinates.lat.toFixed(2)}, ${scan.coordinates.lng.toFixed(2)}` : 'نامشخص'}</span>
                  </div>
                </div>

                {/* Notes */}
                {scan.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed italic">
                    «{scan.notes}»
                  </p>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onLoadScan(scan)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition flex items-center justify-center gap-1.5"
                >
                  <Box className="w-4 h-4" />
                  <span>بارگذاری در ۳بعدی</span>
                </button>

                <button
                  onClick={() => onNavigateToAiWithScan(scan)}
                  title="تحلیل هوشمند Gemini AI"
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDeleteScan(scan.id)}
                  title="حذف اسکن"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredScans.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          هیچ اسکن مطابق با جستجوی شما پیدا نشد.
        </div>
      )}

    </div>
  );
};
