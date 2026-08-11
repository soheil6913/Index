export type ConnectionMode = 'DISCONNECTED' | 'CONNECTING_USB' | 'CONNECTING_BT' | 'USB' | 'BLUETOOTH' | 'SIMULATOR';

export type SensorType = 'GOLD_RADAR_X20' | 'FMG3' | 'FLC100' | 'HMC5883L';

export type SoilType = 'خاک کشاورزی (Soil)' | 'خاک معدنی (Mineral)' | 'سنگ و صخره (Hard Rock)' | 'ماسه خیس (Wet Sand)';

export type ScanPattern = 'موازی (Parallel)' | 'زیگزاگ (Zig-Zag)';

export type RenderStyle = '3d-mesh' | 'point-cloud' | 'wireframe' | 'contour' | 'voxel';

export interface Anomaly {
  id: string;
  x: number;
  y: number;
  depthMeters: number;
  value: number; // raw ADC
  phaseShift: number;
  type: 'gold' | 'ferrous' | 'cavity' | 'mineral';
  confidence: number; // 0 - 100
  title: string;
}

export interface ScanRecord {
  id: string;
  name: string;
  date: string;
  width: number;
  length: number;
  soilType: SoilType;
  scanPattern: ScanPattern;
  sensorType: SensorType;
  gridData: number[]; // ADC values array of length width * length
  phaseData: number[]; // Phase shift values array
  maxDepthMeters: number;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  anomalies?: Anomaly[];
}

export interface AiDetectedObject {
  title: string;
  type: 'precious_metal' | 'ferrous' | 'cavity' | 'mineralization';
  depthEstimateMeters: number;
  confidencePercentage: number;
  x: number;
  y: number;
  description: string;
}

export interface AiAnalysisResult {
  summary: string;
  detectedObjects: AiDetectedObject[];
  soilConductivityIndex: number; // e.g. 1-10 scale
  excavationFeasibility: number; // 1 - 100
  mineralInterferenceLevel: 'کم (Low)' | 'متوسط (Medium)' | 'شدید (High)';
  recommendations: string[];
  geophysicalDataInterpretation: string;
}
