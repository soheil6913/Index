import React, { useState } from 'react';
import { ScanRecord, RenderStyle, Anomaly } from '../types';
import { ThreeVisualizer } from './ThreeVisualizer';
import {
  Box,
  Layers,
  Sliders,
  Sparkles,
  Download,
  Save,
  RotateCcw,
  Eye,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Maximize2
} from 'lucide-react';

interface VisualizerTabProps {
  viewedScan: ScanRecord | null;
  onSaveScan: (name: string, notes: string) => void;
  onNavigateToAi: () => void;
  selectedNodeIndex: number | null;
  setSelectedNodeIndex: (idx: number | null) => void;
}

export const VisualizerTab: React.FC<VisualizerTabProps> = ({
  viewedScan,
  onSaveScan,
  onNavigateToAi,
  selectedNodeIndex,
  setSelectedNodeIndex
}) => {
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('3d-mesh');
  const [zScale, setZScale] = useState<number>(1.2);
  const [colorThreshold, setColorThreshold] = useState<number>(0.5);
  const [sliceX, setSliceX] = useState<number | null>(null);
  const [sliceY, setSliceY] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNotes, setSaveNotes] = useState('');

  // Node details
  const [nodeDetails, setNodeDetails] = useState<{
    x: number;
    y: number;
    adc: number;
    phase: number;
    depth: number;
  } | null>(null);

  if (!viewedScan) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <Box className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
        <h2 className="text-xl font-bold text-white">هیچ اسکن فعالی برای نمایش سه‌بعدی وجود ندارد</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          لطفاً ابتدا یک اسکن زمین جدید در تب «اسکن» ثبت کنید یا یکی از اسکن‌های ذخیره‌شده در تب «تاریخچه» را لود کنید.
        </p>
      </div>
    );
  }

  // Calculate highest anomaly peak & void drop
  let maxAdc = 0;
  let minAdc = 1024;
  let maxAdcIndex = 0;

  viewedScan.gridData.forEach((val, idx) => {
    if (val > maxAdc) {
      maxAdc = val;
      maxAdcIndex = idx;
    }
    if (val < minAdc) {
      minAdc = val;
    }
  });

  const maxX = maxAdcIndex % viewedScan.width;
  const maxY = Math.floor(maxAdcIndex / viewedScan.width);
  const maxPhase = viewedScan.phaseData[maxAdcIndex] ?? 0;

  // Metal vs Cavity Probability
  const isHighMetal = maxAdc > 750 && maxPhase > 20;
  const isDeepCavity = minAdc < 220;

  const handleSelectNode = (idx: number, x: number, y: number, adc: number, phase: number, depth: number) => {
    setSelectedNodeIndex(idx);
    setNodeDetails({ x, y, adc, phase, depth });
  };

  const handleExportCsv = () => {
    let csv = 'X,Y,ADC_Signal,Phase_Shift\n';
    for (let y = 0; y < viewedScan.length; y++) {
      for (let x = 0; x < viewedScan.width; x++) {
        const idx = y * viewedScan.width + x;
        csv += `${x + 1},${y + 1},${viewedScan.gridData[idx]},${viewedScan.phaseData[idx]}\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewedScan.name || 'scan'}_grid.csv`;
    a.click();
  };

  const handleExportJson = () => {
    const json = JSON.stringify(viewedScan, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewedScan.name || 'scan'}_raw.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner & Main Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-amber-400 font-mono">{viewedScan.name}</h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-cyan-400 border border-slate-700 rounded-full">
              {viewedScan.width}×{viewedScan.length} ({viewedScan.soilType})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            تاریخ اسکن: {viewedScan.date} | سنسور: {viewedScan.sensorType} | الگوی اسکن: {viewedScan.scanPattern}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Send to AI */}
          <button
            onClick={onNavigateToAi}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-400/10 hover:scale-102 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>تحلیل هوشمند (AI)</span>
          </button>

          {/* Save Scan Button */}
          <button
            onClick={() => {
              setSaveName(viewedScan.name);
              setShowSaveModal(true);
            }}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره اسکن</span>
          </button>

          {/* Export Dropdown */}
          <button
            onClick={handleExportCsv}
            title="خروجی فایل اکسل CSV"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
          
          <button
            onClick={handleExportJson}
            title="خروجی Raw JSON"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas & Inspector Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: 3D Canvas (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* View Mode Controls Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Render Styles */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { id: '3d-mesh', label: 'سطحی (Surface)' },
                { id: 'point-cloud', label: 'ابر نقاط (Points)' },
                { id: 'wireframe', label: 'توری (Wireframe)' },
                { id: 'voxel', label: 'مکعبی (Voxel)' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setRenderStyle(st.id as RenderStyle)}
                  className={`px-3 py-1.5 rounded-md font-bold transition ${
                    renderStyle === st.id
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Z-Scale Multiplier */}
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <span className="text-amber-400 font-bold">ارتفاع Z:</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={zScale}
                onChange={(e) => setZScale(parseFloat(e.target.value))}
                className="w-24 accent-amber-400"
              />
              <span className="w-8 font-bold text-amber-400">{zScale.toFixed(1)}x</span>
            </div>

            {/* Auto Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
                autoRotate
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span>چرخش خودکار</span>
            </button>
          </div>

          {/* WebGL 3D Canvas Engine */}
          <div className="h-[500px] relative">
            <ThreeVisualizer
              gridData={viewedScan.gridData}
              phaseData={viewedScan.phaseData}
              width={viewedScan.width}
              length={viewedScan.length}
              zScale={zScale}
              renderStyle={renderStyle}
              colorThreshold={colorThreshold}
              maxDepthMeters={viewedScan.maxDepthMeters}
              selectedNodeIndex={selectedNodeIndex}
              onSelectNode={handleSelectNode}
              sliceX={sliceX}
              sliceY={sliceY}
              autoRotate={autoRotate}
            />
          </div>

          {/* Cross-Section Slicing Tool */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-cyan-400" />
                ابزار برش مقطعی (Cross-Section Slice):
              </span>
              {(sliceX !== null || sliceY !== null) && (
                <button
                  onClick={() => {
                    setSliceX(null);
                    setSliceY(null);
                  }}
                  className="text-red-400 hover:underline"
                >
                  حذف برش
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>برش محور X (ستون):</span>
                  <span className="text-cyan-400 font-bold">{sliceX !== null ? `ستون ${sliceX + 1}` : 'کامل'}</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max={viewedScan.width - 1}
                  value={sliceX ?? -1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSliceX(val === -1 ? null : val);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>برش محور Y (ردیف):</span>
                  <span className="text-emerald-400 font-bold">{sliceY !== null ? `خط ${sliceY + 1}` : 'کامل'}</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max={viewedScan.length - 1}
                  value={sliceY ?? -1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSliceY(val === -1 ? null : val);
                  }}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Inspector Sidebar (1 col) */}
        <div className="space-y-4">
          
          {/* Anomaly Detection HUD Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              خلاصه ناهنجاری زمین
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">حداکثر عمق اسکن:</span>
                <span className="text-amber-400 font-bold">{viewedScan.maxDepthMeters} متر</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">بیشترین پیک سیگنال:</span>
                <span className="text-cyan-400 font-bold">{maxAdc} ADC (X:{maxX + 1}, Y:{maxY + 1})</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">اختلاف فاز متناظر:</span>
                <span className="text-emerald-400 font-bold">{maxPhase}°</span>
              </div>
            </div>

            {/* Prediction Badge */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              isHighMetal
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                : isDeepCavity
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            }`}>
              <div className="font-bold mb-1">
                {isHighMetal ? '🎯 آنومالی فلز نجیب / طلا' : isDeepCavity ? '🕳️ آنومالی فضای خالی / حفره' : '🌱 خاک نرم و یکنواخت'}
              </div>
              <p className="text-[11px] opacity-80">
                {isHighMetal
                  ? 'سیگنال مغناطیسی بالا همراه با فاز مثبت نشان‌دهنده شیء فلزی با رسانایی بسیار بالا است.'
                  : isDeepCavity
                  ? 'افت شدید سیگنال نشان‌دهنده وجود ساختار زیرزمینی توخالی یا کانال ساروجی است.'
                  : 'تغییرات زمین در محدوده طبیعی خاک و سنگ‌های معدنی معمولی است.'}
              </p>
            </div>
          </div>

          {/* Interactive Selected Node Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              بازرسی نقطه انتخابی ۳بعدی
            </h3>

            {nodeDetails ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">مختصات شبکه‌ای:</span>
                  <span className="text-amber-400 font-bold">X: {nodeDetails.x + 1} | Y: {nodeDetails.y + 1}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">شدت سیگنال ADC:</span>
                  <span className="text-cyan-400 font-bold">{nodeDetails.adc}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">زاویه فاز Phase:</span>
                  <span className="text-emerald-400 font-bold">{nodeDetails.phase}°</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">تخمین عمق هدف:</span>
                  <span className="text-amber-400 font-bold">{nodeDetails.depth} متر</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                روی هر نقطه از مدل ۳بعدی کلیک کنید تا مشخصات دقیق عمق و سیگنال نمایش داده شود.
              </div>
            )}
          </div>

          {/* Color Spectrum Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300">راهنمای طیف رنگ OKM:</div>
            <div className="h-4 rounded-lg bg-gradient-to-r from-blue-700 via-emerald-500 via-amber-400 to-red-600 border border-slate-700" />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-blue-400">حفره/تونل</span>
              <span className="text-emerald-400">خاک معمولی</span>
              <span className="text-amber-400">مواد معدنی</span>
              <span className="text-red-400">فلز/طلا</span>
            </div>
          </div>

        </div>

      </div>

      {/* Save Scan Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Save className="w-5 h-5 text-amber-400" />
              ذخیره اسکن زمین در تاریخچه
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">نام یا عنوان اسکن:</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none"
                  placeholder="مثال: اسکن زمین منطقه الف"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">یادداشت‌ها و جزئیات میدان:</label>
                <textarea
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-400 outline-none"
                  placeholder="موقعیت جغرافیایی، شرایط آب‌وهوا یا توضیحات خاک..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  onSaveScan(saveName || 'اسکن زمین جدید', saveNotes);
                  setShowSaveModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-md shadow-amber-400/20"
              >
                تأیید و ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
