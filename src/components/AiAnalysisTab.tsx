import React, { useState, useEffect } from 'react';
import { ScanRecord, AiAnalysisResult } from '../types';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Globe,
  Loader2,
  Box,
  TrendingUp,
  Cpu,
  Zap
} from 'lucide-react';

interface AiAnalysisTabProps {
  viewedScan: ScanRecord | null;
}

export const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({ viewedScan }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'fa' | 'en'>('fa');

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
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'خطا در ارتباط با سرور Gemini AI';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewedScan && !analysis && !loading) {
      runAnalysis();
    }
  }, [viewedScan]);

  if (!viewedScan) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <Sparkles className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-white">هیچ اسکنی برای تحلیل هوش مصنوعی انتخاب نشده است</h2>
        <p className="text-xs text-slate-400">
          لطفاً ابتدا یک اسکن زمین را در نمای ۳بعدی یا از تاریخچه انتخاب کنید تا آنالیز ژئوفیزیک Gemini انجام شود.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">
              آنالیز ژئوفیزیک با Gemini 3.6 Flash AI
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            شناسایی هوشمند جنس اهداف، تفکیک طلا و حفره با هوش مصنوعی شبکه عصبی
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'fa' ? 'English Report' : 'گزارش فارسی'}</span>
          </button>

          {/* Re-run Analysis */}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>پردازش مجدد (Re-analyze)</span>
          </button>
        </div>
      </div>

      {/* Target Scan Info Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-between items-center text-xs font-mono text-slate-300">
        <div>پروژه: <span className="text-amber-400 font-bold">{viewedScan.name}</span></div>
        <div>نوع خاک: <span className="text-cyan-400 font-bold">{viewedScan.soilType}</span></div>
        <div>ابعاد: <span className="text-emerald-400 font-bold">{viewedScan.width}×{viewedScan.length}</span></div>
        <div>سنسور: <span className="text-amber-400 font-bold">{viewedScan.sensorType}</span></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">در حال پردازش ماتریس پالس‌ها با مدل Gemini AI...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            محاسبه انحراف مغناطیسی، آنالیز متقابل فاز، تخمین رسانایی خاک و تطبیق الگوی حفره‌ها و اهداف فلزی...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-300 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>خطا در دریافت پاسخ از هوش مصنوعی:</span>
          </div>
          <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-red-400">{error}</p>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Results Section */}
      {analysis && !loading && (
        <div className="space-y-6">
          
          {/* Executive Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              خلاصه اجرایی آنالیز ژئوفیزیک (Executive Summary)
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {analysis.summary}
            </p>
          </div>

          {/* Key Indicators Grid */}
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

          {/* Detected Underground Objects */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              اهداف و ناهنجاری‌های ردیابی‌شده در زیر زمین
            </h3>

            <div className="space-y-4">
              {analysis.detectedObjects.map((obj, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-3 ${
                    obj.type === 'precious_metal'
                      ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                      : obj.type === 'cavity'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{obj.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-400 font-bold">
                        عمق: {obj.depthEstimateMeters}m
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-400 font-bold">
                        اطمینان: {obj.confidencePercentage}%
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">
                        موقعیت: (X:{obj.x + 1}, Y:{obj.y + 1})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed font-sans">{obj.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Field Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
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

    </div>
  );
};
