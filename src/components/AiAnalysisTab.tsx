import React, { useState, useEffect } from 'react';
import { ScanRecord, AiAnalysisResult, MultiScanComparisonResult } from '../types';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Globe,
  Loader2,
  Box,
  TrendingUp,
  Cpu,
  Zap,
  GitCompare,
  Square,
  CheckSquare,
  BarChart2,
  Layers3,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface AiAnalysisTabProps {
  viewedScan: ScanRecord | null;
  scans?: ScanRecord[];
  onLoadScan?: (scan: ScanRecord) => void;
}

// Color mapper for 2D mini heatmap thumbnails
const getHeatmapColor = (val: number) => {
  if (val < 250) return '#06b6d4'; // Cavity (cyan)
  if (val < 500) return '#10b981'; // Soil (emerald)
  if (val < 750) return '#f59e0b'; // Mineral (amber)
  return '#ef4444'; // Metal (red)
};

export const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({
  viewedScan,
  scans = [],
  onLoadScan
}) => {
  // Mode State: 'single' (Single Scan AI) vs 'multi-compare' (Multi-Scan Soil Pattern Correlation)
  const [activeMode, setActiveMode] = useState<'single' | 'multi-compare'>('single');

  // Single Scan AI Analysis State
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'fa' | 'en'>('fa');

  // Multi-Scan Soil Pattern Comparison State
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>(() => {
    if (scans.length > 0) {
      return scans.slice(0, 3).map((s) => s.id);
    }
    return viewedScan ? [viewedScan.id] : [];
  });
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<MultiScanComparisonResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Single Scan AI Fetch
  const runAnalysis = async () => {
    if (!viewedScan) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan: viewedScan })
      });

      if (!response.ok) {
        throw new Error(`خطای پردازش هوش مصنوعی (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'خطا در ارتباط با سرور Gemini AI';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Multi-Scan Comparison Fetch
  const runMultiScanComparison = async () => {
    const selectedScans = scans.filter((s) => selectedScanIds.includes(s.id));
    if (selectedScans.length === 0) return;

    setCompareLoading(true);
    setCompareError(null);

    try {
      const response = await fetch('/api/gemini/compare-scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scans: selectedScans })
      });

      if (!response.ok) {
        throw new Error(`خطای پردازش هوش مصنوعی مقایسه (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCompareResult(data.comparison);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'خطا در الگوریتم مقایسه متقاطع خاک';
      setCompareError(errMsg);
    } finally {
      setCompareLoading(false);
    }
  };

  useEffect(() => {
    if (viewedScan && !analysis && !loading && activeMode === 'single') {
      runAnalysis();
    }
  }, [viewedScan, activeMode]);

  // Auto trigger compare analysis on switching to compare mode if result null
  useEffect(() => {
    if (activeMode === 'multi-compare' && !compareResult && !compareLoading && selectedScanIds.length > 0) {
      runMultiScanComparison();
    }
  }, [activeMode]);

  const toggleSelectScan = (id: string) => {
    if (selectedScanIds.includes(id)) {
      if (selectedScanIds.length > 1) {
        setSelectedScanIds(selectedScanIds.filter((sid) => sid !== id));
      }
    } else {
      setSelectedScanIds([...selectedScanIds, id]);
    }
  };

  const selectedScans = scans.filter((s) => selectedScanIds.includes(s.id));

  return (
    <div className="max-w-5xl mx-auto space-y-6 dir-rtl text-slate-100">
      
      {/* Top Banner with Tool Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">
              ابزارهای هوش مصنوعی ژئوفیزیک Gemini 3.6
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            آنالیز لایه‌بندی بستر، کشف اهداف فلزی و استخراج الگوهای تکرارشونده خاک در چند اسکن
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveMode('single')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeMode === 'single'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>آنالیز تک اسکن</span>
          </button>

          <button
            onClick={() => setActiveMode('multi-compare')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeMode === 'multi-compare'
                ? 'bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>مقایسه الگوی خاک چند اسکن</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SINGLE SCAN AI ANALYSIS */}
      {activeMode === 'single' && (
        <div className="space-y-6">
          {!viewedScan ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Box className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">هیچ اسکنی برای آنالیز تک اسکن انتخاب نشده است</h3>
              <p className="text-xs text-slate-400">لطفاً ابتدا یک اسکن را لود کنید.</p>
            </div>
          ) : (
            <>
              {/* Target Scan Header Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center text-xs font-mono text-slate-300">
                <div>پروژه: <span className="text-amber-400 font-bold">{viewedScan.name}</span></div>
                <div>نوع خاک: <span className="text-cyan-400 font-bold">{viewedScan.soilType}</span></div>
                <div>ابعاد: <span className="text-emerald-400 font-bold">{viewedScan.width}×{viewedScan.length}</span></div>
                <div>عمق تخمینی: <span className="text-amber-400 font-bold">{viewedScan.maxDepthMeters}m</span></div>
                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold transition flex items-center gap-1"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>پردازش مجدد</span>
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
                  <h3 className="text-lg font-bold text-white">در حال پردازش داده‌های زیرسطحی با Gemini AI...</h3>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>خطا در تحلیل:</span>
                  </div>
                  <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">{error}</p>
                </div>
              )}

              {/* Results */}
              {analysis && !loading && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      خلاصه اجرایی آنالیز ژئوفیزیک (Executive Summary)
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-2 shadow-xl">
                      <div className="text-xs text-slate-400 font-bold">شاخص رسانایی خاک</div>
                      <div className="text-3xl font-black font-mono text-cyan-400">{analysis.soilConductivityIndex} / 10</div>
                      <div className="text-[11px] text-slate-400">رسانایی الکتریکی بستر</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-2 shadow-xl">
                      <div className="text-xs text-slate-400 font-bold">امتیاز امکان‌سنجی حفاری</div>
                      <div className="text-3xl font-black font-mono text-amber-400">{analysis.excavationFeasibility}%</div>
                      <div className="text-[11px] text-slate-400">تخمین اطمینان کاوش</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-2 shadow-xl">
                      <div className="text-xs text-slate-400 font-bold">سطح تداخلات معدنی</div>
                      <div className="text-2xl font-black font-mono text-emerald-400">{analysis.mineralInterferenceLevel}</div>
                      <div className="text-[11px] text-slate-400">نویز سنگ و ذرات</div>
                    </div>
                  </div>

                  {/* Detected Objects */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-4 h-4 text-cyan-400" />
                      اهداف و ناهنجاری‌های ردیابی‌شده در زیر زمین
                    </h3>

                    <div className="space-y-3">
                      {analysis.detectedObjects.map((obj, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border space-y-2 ${
                            obj.type === 'precious_metal'
                              ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                              : obj.type === 'cavity'
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                              : 'bg-slate-950 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                            <span className="font-bold text-sm text-white">{obj.title}</span>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-400">
                                عمق: {obj.depthEstimateMeters}m
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-400 font-bold">
                                اطمینان: {obj.confidencePercentage}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs opacity-90 leading-relaxed font-sans">{obj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      توصیه‌های کارشناسی اپراتور برای کاوش میدانی
                    </h3>

                    <ul className="space-y-2 text-xs text-slate-200">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <span className="text-amber-400 font-mono font-bold">{idx + 1}.</span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODE 2: MULTI-SCAN RECURRING SOIL PATTERN COMPARISON TOOL */}
      {activeMode === 'multi-compare' && (
        <div className="space-y-6">
          
          {/* Scan Selection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-amber-400" />
                  انتخاب اسکن‌ها برای استخراج همبستگی الگوی خاک
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اسکن‌های مورد نظر را برای آنالیز الگوی تکرارشونده بستر انتخاب کنید ({selectedScanIds.length} اسکن فعال).
                </p>
              </div>

              {/* Selection Shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedScanIds(scans.map((s) => s.id))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition"
                >
                  انتخاب همه
                </button>
                <button
                  onClick={() => setSelectedScanIds(scans.slice(0, 3).map((s) => s.id))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-bold transition"
                >
                  ۳ اسکن اخیر
                </button>
              </div>
            </div>

            {/* Scan Selection Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scans.map((scan) => {
                const isSelected = selectedScanIds.includes(scan.id);
                let peak = 0;
                scan.gridData.forEach((v) => { if (v > peak) peak = v; });

                return (
                  <div
                    key={scan.id}
                    onClick={() => toggleSelectScan(scan.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-400/80 text-white shadow-md shadow-cyan-400/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-xs truncate text-slate-200">{scan.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {scan.date} | {scan.width}×{scan.length} | {peak} ADC
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
                      {scan.soilType.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Execute Compare AI Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={runMultiScanComparison}
                disabled={compareLoading || selectedScanIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-cyan-400 to-amber-500 hover:scale-102 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-cyan-400/20 transition flex items-center gap-2"
              >
                {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                <span>پردازش متقاطع الگوی خاک با Gemini AI ({selectedScanIds.length} اسکن)</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Visual Comparison Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              نمای تطبیقی پهلو به پهلو اسکن‌های انتخاب‌شده ({selectedScans.length} اسکن)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedScans.map((scan) => {
                let peak = 0;
                let minV = 1024;
                let sum = 0;
                scan.gridData.forEach((v) => {
                  sum += v;
                  if (v > peak) peak = v;
                  if (v < minV) minV = v;
                });
                const avg = Math.round(sum / (scan.gridData.length || 1));

                return (
                  <div
                    key={scan.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl hover:border-cyan-400/40 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-xs text-white truncate">{scan.name}</span>
                        <span className="text-[10px] font-mono text-amber-400">{scan.date}</span>
                      </div>

                      {/* Mini 2D Heatmap Thumbnail */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
                        <div
                          className="grid gap-0.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800 max-h-28 overflow-hidden"
                          style={{ gridTemplateColumns: `repeat(${scan.width}, minmax(0, 1fr))` }}
                        >
                          {scan.gridData.map((val, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-xs transition hover:scale-125"
                              style={{ backgroundColor: getHeatmapColor(val) }}
                              title={`X:${(idx % scan.width) + 1}, Y:${Math.floor(idx / scan.width) + 1}: ${val} ADC`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          بستر زمینه: <strong className="text-cyan-400">{avg} ADC</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          پیک سیگنال: <strong className="text-amber-400">{peak} ADC</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          ابعاد: <strong className="text-slate-300">{scan.width}×{scan.length}</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          افت حفره: <strong className="text-blue-400">{minV} ADC</strong>
                        </div>
                      </div>
                    </div>

                    {onLoadScan && (
                      <button
                        onClick={() => onLoadScan(scan)}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition mt-2 flex items-center justify-center gap-1"
                      >
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        <span>نمایش در ۳بعدی</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loading Comparison */}
          {compareLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">در حال استخراج همبستگی متقاطع الگوهای خاک...</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                تطبیق نویز زمینه مغناطیسی، آنالیز لایه‌بندی بستر و تفکیک سیگنال‌های تکرارشونده معدنی از اهداف مستقل...
              </p>
            </div>
          )}

          {/* Error Comparison */}
          {compareError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>خطا در آنالیز مقایسه‌ای:</span>
              </div>
              <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">{compareError}</p>
            </div>
          )}

          {/* AI Multi-Scan Soil Pattern Comparison Results */}
          {compareResult && !compareLoading && (
            <div className="space-y-6">
              
              {/* Correlation Index & Executive Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      نتایج آنالیز همبستگی متقاطع الگوهای خاک (Soil Correlation Analysis)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ارزیابی یکنواختی بستر و لایه‌بندی خاک در تمامی اسکن‌های انتخابی
                    </p>
                  </div>

                  {/* Soil Correlation Gauge Badge */}
                  <div className="bg-slate-950 border border-cyan-400/40 p-3 rounded-2xl text-center shadow-lg shrink-0">
                    <div className="text-[10px] text-slate-400 font-bold">شاخص یکنواختی خاک</div>
                    <div className="text-3xl font-black font-mono text-cyan-400">{compareResult.soilCorrelationIndex}%</div>
                    <div className="text-[9px] text-emerald-400 font-bold">همبستگی بالا</div>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {compareResult.summary}
                </p>
              </div>

              {/* Recurring Soil Patterns Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers3 className="w-5 h-5 text-cyan-400" />
                  الگوهای تکرارشونده زیرسطحی خاک و بستر (Recurring Soil Patterns)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compareResult.recurringPatterns.map((pt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5 hover:border-amber-400/40 transition"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{pt.patternTitle}</span>
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded">
                          اطمینان: {pt.consistencyConfidence}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{pt.description}</p>

                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                        <span>تعداد اسکن‌های تحت تاثیر: <strong className="text-white">{pt.affectedScansCount} اسکن</strong></span>
                        <span className="text-cyan-400 font-bold uppercase">{pt.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unique Scan Anomalies vs Soil Background Noise */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  تفکیک آنومالی‌های مستقل هدف از نویز زمینه خاک
                </h3>

                <div className="space-y-3">
                  {compareResult.uniqueAnomaliesPerScan.map((uan, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        uan.significance === 'high'
                          ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{uan.scanName}</span>
                        </div>
                        <p className="text-xs opacity-90">{uan.anomalyDescription}</p>
                      </div>

                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold shrink-0 self-start sm:self-center ${
                        uan.significance === 'high'
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {uan.significance === 'high' ? 'آنومالی برجسته' : 'منطبق بر خاک زمینه'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Operator Recommendations */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  توصیه‌های کارشناسی اپراتور برای تحلیل تطبیقی خاک
                </h3>

                <ul className="space-y-2 text-xs text-slate-200">
                  {compareResult.operatorRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-mono font-bold">{idx + 1}.</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
