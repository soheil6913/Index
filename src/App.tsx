import React, { useState, useEffect, useCallback } from 'react';
import {
  ScanRecord,
  ConnectionMode,
  SensorType,
  SoilType,
  ScanPattern
} from './types';
import { SAMPLE_SCANS } from './utils/sampleData';
import { audioEngine } from './utils/audio';
import { Header } from './components/Header';
import { ScanTab } from './components/ScanTab';
import { VisualizerTab } from './components/VisualizerTab';
import { TrackerTab } from './components/TrackerTab';
import { HistoryTab } from './components/HistoryTab';
import { AiAnalysisTab } from './components/AiAnalysisTab';
import { MapTab } from './components/MapTab';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('scan');

  // Connection Manager
  const [connectionState, setConnectionState] = useState<ConnectionMode>('SIMULATOR');
  const [connectionStatus, setConnectionStatus] = useState<string>('شبیه‌ساز (Simulator)');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Scan Configuration State
  const [gridWidth, setGridWidth] = useState<number>(10);
  const [gridLength, setGridLength] = useState<number>(14);
  const [soilType, setSoilType] = useState<SoilType>('خاک کشاورزی (Soil)');
  const [scanPattern, setScanPattern] = useState<ScanPattern>('موازی (Parallel)');
  const [sensorType, setSensorType] = useState<SensorType>('GOLD_RADAR_X20');
  const [baudRate, setBaudRate] = useState<number>(115200);

  // Live Magnetometer Readings
  const [adcValue, setAdcValue] = useState<number>(380);
  const [phaseShift, setPhaseShift] = useState<number>(2);
  const [compassHeading, setCompassHeading] = useState<number>(45.0);

  // Active Scan Acquisition State
  const [isScanActive, setIsScanActive] = useState<boolean>(false);
  const [currentCol, setCurrentCol] = useState<number>(0);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [activeScanData, setActiveScanData] = useState<number[]>([]);
  const [activePhaseData, setActivePhaseData] = useState<number[]>([]);

  // Saved History & Active Viewed Scan in 3D
  const [savedScans, setSavedScans] = useState<ScanRecord[]>(SAMPLE_SCANS);
  const [viewedScan, setViewedScan] = useState<ScanRecord | null>(SAMPLE_SCANS[0]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Audio mute handler
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  // Auto connect toggle button handler
  const handleAutoConnect = () => {
    if (connectionState === 'SIMULATOR') {
      setConnectionState('CONNECTING_USB');
      setConnectionStatus('در حال جستجوی کابل USB...');
      setTimeout(() => {
        setConnectionState('USB');
        setConnectionStatus('اتصال USB برقرار شد');
      }, 1200);
    } else if (connectionState === 'USB') {
      setConnectionState('CONNECTING_BT');
      setConnectionStatus('در حال جستجوی بلوتوث...');
      setTimeout(() => {
        setConnectionState('BLUETOOTH');
        setConnectionStatus('اتصال بلوتوث فعال شد');
      }, 1200);
    } else {
      setConnectionState('SIMULATOR');
      setConnectionStatus('شبیه‌ساز (Simulator)');
    }
  };

  // Continuous background sensor simulation (noise & compass drift)
  useEffect(() => {
    const interval = setInterval(() => {
      // Compass slow natural drift
      setCompassHeading((prev) => (prev + (Math.random() * 1.2 - 0.6) + 360) % 360);

      // Sensor signal fluctuation
      const noise = Math.floor(Math.random() * 14 - 7);
      setAdcValue((prev) => {
        const next = Math.max(120, Math.min(980, prev + noise));
        return next;
      });

      setPhaseShift((prev) => {
        const pNoise = Math.floor(Math.random() * 4 - 2);
        return Math.max(-60, Math.min(60, prev + pNoise));
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Start new scan session
  const handleStartScan = () => {
    setIsScanActive(true);
    setCurrentCol(0);
    setCurrentRow(0);
    setActiveScanData([]);
    setActivePhaseData([]);
  };

  // Record single pulse step in scan mode
  const handleRecordStep = useCallback(() => {
    // Generate realistic ground response with occasional anomaly peak
    let currentPulseAdc = adcValue;
    let currentPulsePhase = phaseShift;

    // Simulate high peak near center
    const totalPoints = gridWidth * gridLength;
    const currentIdx = activeScanData.length;

    if (currentIdx < totalPoints) {
      const x = currentIdx % gridWidth;
      const y = Math.floor(currentIdx / gridWidth);

      const centerX = Math.floor(gridWidth / 2);
      const centerY = Math.floor(gridLength / 2);
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (dist < 1.8) {
        // High Gold Peak!
        currentPulseAdc = 850 + Math.floor(Math.random() * 60);
        currentPulsePhase = 45 + Math.floor(Math.random() * 10);
      } else if (dist >= 1.8 && dist < 3.2) {
        // Cavity Drop surrounding
        currentPulseAdc = 170 + Math.floor(Math.random() * 30);
        currentPulsePhase = -40 + Math.floor(Math.random() * 10);
      }

      setActiveScanData((prev) => [...prev, currentPulseAdc]);
      setActivePhaseData((prev) => [...prev, currentPulsePhase]);

      // Calculate next cursor position
      const isZigZag = scanPattern.includes('Zig-Zag') || scanPattern.includes('زیگزاگ');
      const goingRight = !isZigZag || (y % 2 === 0);

      if (goingRight) {
        if (x < gridWidth - 1) {
          setCurrentCol(x + 1);
        } else if (y < gridLength - 1) {
          setCurrentRow(y + 1);
          setCurrentCol(isZigZag ? gridWidth - 1 : 0);
        }
      } else {
        if (x > 0) {
          setCurrentCol(x - 1);
        } else if (y < gridLength - 1) {
          setCurrentRow(y + 1);
          setCurrentCol(0);
        }
      }

      // If finished last point
      if (currentIdx + 1 >= totalPoints) {
        audioEngine.playScanCompleteChime();
      }
    }
  }, [adcValue, phaseShift, gridWidth, gridLength, activeScanData.length, scanPattern]);

  // Cancel / Discard active scan
  const handleCancelScan = () => {
    setIsScanActive(false);
    setActiveScanData([]);
    setActivePhaseData([]);
  };

  // Complete scan and load into 3D Visualizer
  const handleCompleteScan = () => {
    const newScan: ScanRecord = {
      id: `scan-${Date.now()}`,
      name: `اسکن زمین (${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })})`,
      date: new Date().toLocaleDateString('fa-IR'),
      width: gridWidth,
      length: gridLength,
      soilType,
      scanPattern,
      sensorType,
      gridData: activeScanData,
      phaseData: activePhaseData,
      maxDepthMeters: 4.5,
      notes: 'اسکن ثبت‌شده با درایور مگنتومتر OKM'
    };

    setSavedScans((prev) => [newScan, ...prev]);
    setViewedScan(newScan);
    setIsScanActive(false);
    setCurrentTab('visualizer');
  };

  // Save scan modal callback
  const handleSaveScanRecord = (name: string, notes: string) => {
    if (viewedScan) {
      const updated = { ...viewedScan, name, notes };
      setViewedScan(updated);
      setSavedScans((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  // Delete scan from history
  const handleDeleteScan = (id: string) => {
    setSavedScans((prev) => prev.filter((s) => s.id !== id));
    if (viewedScan && viewedScan.id === id) {
      setViewedScan(savedScans.find((s) => s.id !== id) || null);
    }
  };

  // Update scan coordinates
  const handleUpdateScanCoordinates = (scanId: string, lat: number, lng: number) => {
    setSavedScans((prev) =>
      prev.map((s) => (s.id === scanId ? { ...s, coordinates: { lat, lng } } : s))
    );
    if (viewedScan && viewedScan.id === scanId) {
      setViewedScan({ ...viewedScan, coordinates: { lat, lng } });
    }
  };

  // Navigate to AI with specific scan
  const handleNavigateToAiWithScan = (scan: ScanRecord) => {
    setViewedScan(scan);
    setCurrentTab('ai');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 dir-rtl" dir="rtl">
      
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        connectionState={connectionState}
        connectionStatus={connectionStatus}
        onAutoConnect={handleAutoConnect}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {currentTab === 'scan' && (
          <ScanTab
            gridWidth={gridWidth}
            setGridWidth={setGridWidth}
            gridLength={gridLength}
            setGridLength={setGridLength}
            soilType={soilType}
            setSoilType={setSoilType}
            scanPattern={scanPattern}
            setScanPattern={setScanPattern}
            sensorType={sensorType}
            setSensorType={setSensorType}
            baudRate={baudRate}
            setBaudRate={setBaudRate}
            connectionState={connectionState}
            connectionStatus={connectionStatus}
            compassHeading={compassHeading}
            isScanActive={isScanActive}
            onStartScan={handleStartScan}
            onCancelScan={handleCancelScan}
            onCompleteScan={handleCompleteScan}
            activeScanData={activeScanData}
            activePhaseData={activePhaseData}
            currentCol={currentCol}
            currentRow={currentRow}
            onRecordStep={handleRecordStep}
            adcValue={adcValue}
            phaseShift={phaseShift}
            onNavigateToAi={() => setCurrentTab('ai')}
          />
        )}

        {currentTab === 'visualizer' && (
          <VisualizerTab
            viewedScan={viewedScan}
            onSaveScan={handleSaveScanRecord}
            onNavigateToAi={() => setCurrentTab('ai')}
            selectedNodeIndex={selectedNodeIndex}
            setSelectedNodeIndex={setSelectedNodeIndex}
          />
        )}

        {currentTab === 'map' && (
          <MapTab
            scans={savedScans}
            viewedScan={viewedScan}
            onSelectScan={(scan) => {
              setViewedScan(scan);
              setCurrentTab('visualizer');
            }}
            onNavigateToAiWithScan={handleNavigateToAiWithScan}
            onUpdateScanCoordinates={handleUpdateScanCoordinates}
          />
        )}

        {currentTab === 'tracker' && (
          <TrackerTab
            adcValue={adcValue}
            phaseShift={phaseShift}
            connectionStatus={connectionStatus}
          />
        )}

        {currentTab === 'history' && (
          <HistoryTab
            scans={savedScans}
            onLoadScan={(scan) => {
              setViewedScan(scan);
              setCurrentTab('visualizer');
            }}
            onDeleteScan={handleDeleteScan}
            onNavigateToAiWithScan={handleNavigateToAiWithScan}
          />
        )}

        {currentTab === 'ai' && (
          <AiAnalysisTab viewedScan={viewedScan} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>OKM 3D VISUALIZER & GEOPHYSICAL RADAR v4.2</div>
          <div>پشتیبانی از درایورهای مغناطیسی X20, FMG3, FLC100 و مدل هوش مصنوعی Gemini 3.6 Flash</div>
        </div>
      </footer>

    </div>
  );
}
