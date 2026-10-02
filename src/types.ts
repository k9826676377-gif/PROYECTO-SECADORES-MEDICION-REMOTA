export type PointType = 'dryer' | 'felt_roll_upper' | 'felt_roll_pocket' | 'pinion';

export type PointStatus = 'pending' | 'in_progress' | 'installed' | 'verified' | 'blocked';

export type BoxId = 'JB #1' | 'JB #2' | 'JB #3' | 'JB Area 1' | 'JB Area 2' | 'JB Area 3' | 'JB-01' | 'JB-02' | 'JB-03' | 'Área Sótano' | 'JB Sótano' | string;

export interface InstallationStages {
  baseMachined: boolean;      // 1. Base / Espárrago roscado 1/4"-28 UNF instalado
  sensorMounted: boolean;     // 2. Acelerómetro montado con torque (3-5 Nm)
  conduitInstalled: boolean;  // 3. Tubería conduit flexible / coraza instalada
  cablePulled: boolean;       // 4. Cable blindado tendido y rotulado
  connectedToJB: boolean;     // 5. Conexionado y peinado en bornera de Caja JB
  biasVerified: boolean;      // 6. Voltaje de Bias DC medido y verificado (10-14V)
  vibrationTestOk: boolean;   // 7. Espectro dinámico de prueba y continuidad OK
}

export interface MeasurementPoint {
  id: string;
  tag: string;                // Ej: 1S L3-01, 1R L3-12B, P-I (A)
  name: string;               // Ej: Cilindro Secador #1, Rodillo Lona Superior 12B, Piñón Intermedio I-A
  type: PointType;
  boxId: BoxId;
  boxChannel: number;         // 1 a 48
  area: 1 | 2 | 3 | 4 | 'sotano' | string;
  originalLabel?: string;     // Consecutivo original del diagrama (ej: "1 B", "11", "AA", "III C")
  side: 'Lado transmisión' | 'Lado transmisión (LA)' | 'Lado Accionamiento (LA)' | 'Lado Operación (LO)' | 'Ambos' | string;
  zone?: 'Piso Operación Lado 3' | 'Sotano Lado 1' | 'Sotano Lado 3' | 'Sup. Piso Operación Lado 1' | 'Sup. Piso Operación Lado 3' | string;
  orientation?: 'Radial Vertical' | 'Radial Horizontal' | 'Axial' | 'Triaxial' | string;
  sensorModel?: string;        // Ej: "Acelerómetro Industrial 100 mV/g ICP (CTC AC102 / SKF CMSS 2200)"
  sensorSerial?: string;       // Ej: "SN-2024-0418"
  cableMeters?: number;        // Metros de cable tendido
  cableTag?: string;           // Etiqueta del cable ej: "CBL-1S-01"
  status: PointStatus;
  stages: InstallationStages;
  biasVoltage?: number;       // VDC medido en la caja (típicamente 10.5 a 13.5 VDC)
  condition?: 'nuevo' | 'viejo' | null; // Condición del equipo: NUEVO o VIEJO
  mountingType?: 'disco' | 'perforacion' | null; // Opción de montaje: Disco de Montaje o Perforación directa
  installedDate?: string;     // Fecha de montaje
  technician?: string;        // Técnico responsable
  notes?: string;             // Observaciones de campo
  coordinates?: {
    x: number;                // Posición X en el diagrama esquemático (0-1200)
    y: number;                // Posición Y en el diagrama esquemático (0-400)
    radius?: number;          // Radio del elemento
  };
  costHardware?: number;       // Costo del acelerómetro y conector
  costCableAndConduit?: number;// Costo de cable y coraza
  costLabor?: number;          // Costo de horas hombre de instalación
}

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: 'sensors' | 'cables' | 'boxes' | 'mounting' | 'conduit' | 'connectors' | 'accessories';
  unit: string;               // Unidad, Metros, Rollos, Kits, etc.
  requiredQty: number;        // Requerido según diseño
  stockQty: number;           // En almacén / entregado a contratista
  installedQty: number;       // Consumido e instalado en campo
  unitCost: number;           // Costo unitario en USD
  supplier?: string;
  minStockThreshold: number;
  imageUrl?: string;          // Imagen o foto adjunta del material
}

export interface CostCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface JunctionBox {
  id: BoxId;
  name: string;
  area: 1 | 2 | 3 | 4 | 'sotano' | string;
  location: string;
  totalChannels: number;      // Típicamente 48
  usedChannels: number;
  enclosureType: string;
  status: 'operational' | 'in_progress' | 'pending';
  installedDate?: string;
  notes?: string;
}

export interface ProjectStats {
  totalPoints: number;
  installedPoints: number;
  inProgressPoints: number;
  pendingPoints: number;
  blockedPoints: number;
  percentComplete: number;
  totalBudget: number;
  totalSpent: number;
  projectedCost: number;
  totalCableMeters: number;
}
