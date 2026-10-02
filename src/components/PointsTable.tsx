import React, { useState, useMemo } from 'react';
import { MeasurementPoint, PointStatus, PointType, BoxId } from '../types';
import { INITIAL_POINTS } from '../data/initialData';
import { 
  Search, 
  Download, 
  Check, 
  Plus,
  List,
  Layers,
  Box,
  Edit3,
  CheckCircle2,
  Circle,
  Trash2,
  AlertTriangle,
  Cpu,
  Zap,
  Package,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';

// Format Box ID cleanly to JB #1, JB #2, JB #3, Área Sótano
export const formatBoxId = (boxId?: string): string => {
  if (!boxId) return 'JB #1';
  const clean = String(boxId).trim();
  if (clean.toLowerCase().includes('sotano') || clean.toLowerCase().includes('sótano')) return 'Área Sótano';
  if (clean === 'JB #1' || clean === 'JB Area 1' || clean === 'JB-01' || clean.endsWith('1') || clean.toLowerCase().includes('area 1') || clean.toLowerCase().includes('área 1')) return 'JB #1';
  if (clean === 'JB #2' || clean === 'JB Area 2' || clean === 'JB-02' || clean.endsWith('2') || clean.toLowerCase().includes('area 2') || clean.toLowerCase().includes('área 2')) return 'JB #2';
  if (clean === 'JB #3' || clean === 'JB Area 3' || clean === 'JB-03' || clean.endsWith('3') || clean.toLowerCase().includes('area 3') || clean.toLowerCase().includes('área 3')) return 'JB #3';
  return clean.replace(/^JB\s+Area\s*/i, 'JB #').replace(/^JB-0?/, 'JB #');
};

interface PointsTableProps {
  points: MeasurementPoint[];
  onSelectPoint: (point: MeasurementPoint) => void;
  onUpdatePoints: (updatedPoints: MeasurementPoint[]) => void;
  onAddNewPoint: () => void;
  onDeletePoint?: (pointId: string) => void;
  onDeletePointsBulk?: (pointIds: string[]) => void;
}

type ViewMode = 'table' | 'grouped_type' | 'grouped_box';

// Helper to get Nomenclature following exact requested consecutives:
// - Dryers: 1S, 2S, 3S... 48S
// - Pinions: P-AA, luego desde la A hasta la C (P-A, P-B, P-C), y desde el I hasta el III (P-I, P-II, P-III)
// - Felt rolls: 1R, 2R, 3R...
export const getNomenclature = (point: MeasurementPoint): string => {
  if (point.type === 'dryer') {
    // If tag is already a clean dryer tag like "1S", "2S", "23A", "38S"
    if (point.tag && /^\d+[A-Z]?S?$/i.test(point.tag.trim()) && !/L\d/i.test(point.tag)) {
      return point.tag.trim().toUpperCase();
    }
    const match = 
      (point.name && point.name.match(/#\s*(\d+[A-Z]?)/i)) ||
      (point.id && point.id.match(/pt-\d+s-(\d+[a-z]?)/i)) ||
      (point.originalLabel && point.originalLabel.match(/^(\d+[A-Z]?)/i)) ||
      (point.tag && point.tag.match(/L3-(\d+)/i));

    if (match) {
      const raw = match[1].toUpperCase().replace(/^0+/, '');
      return raw.endsWith('S') || raw.endsWith('A') ? raw : `${raw}S`;
    }
    return point.tag && point.tag.trim() ? point.tag.trim() : '1S';
  }

  if (point.tag && point.tag.trim()) {
    return point.tag.trim();
  }

  if (point.type === 'pinion') {
    const match = INITIAL_POINTS.find(p => p.id === point.id);
    if (match && match.tag && /^P-[A-Z0-9]+$/i.test(match.tag.trim())) {
      return match.tag.trim().toUpperCase();
    }
    const raw = (point.originalLabel || point.name || '').toUpperCase();
    if (raw.includes('AA')) return 'P-AA';
    if (raw.includes('XXVIII')) return 'P-XXVIII';
    if (raw.includes('XXVII')) return 'P-XXVII';
    if (raw.includes('XXVI')) return 'P-XXVI';
    if (raw.includes('XXIX')) return 'P-XXIX';
    if (raw.includes('XXV')) return 'P-XXV';
    if (raw.includes('XXIV')) return 'P-XXIV';
    if (raw.includes('XXIII')) return 'P-XXIII';
    if (raw.includes('XXII')) return 'P-XXII';
    if (raw.includes('XXI')) return 'P-XXI';
    if (raw.includes('XX')) return 'P-XX';
    if (raw.includes('XVIII')) return 'P-XVIII';
    if (raw.includes('XVII')) return 'P-XVII';
    if (raw.includes('XVI')) return 'P-XVI';
    if (raw.includes('XIX')) return 'P-XIX';
    if (raw.includes('XIV')) return 'P-XIV';
    if (raw.includes('XV')) return 'P-XV';
    if (raw.includes('XIII')) return 'P-XIII';
    if (raw.includes('XII')) return 'P-XII';
    if (raw.includes('XI')) return 'P-XI';
    if (raw.includes('X')) return 'P-X';
    if (raw.includes('VIII')) return 'P-VIII';
    if (raw.includes('VII')) return 'P-VII';
    if (raw.includes('VI')) return 'P-VI';
    if (raw.includes('IV')) return 'P-IV';
    if (raw.includes('IX')) return 'P-IX';
    if (raw.includes('V')) return 'P-V';
    if (raw.includes('III')) return 'P-III';
    if (raw.includes('II')) return 'P-II';
    if (/\bI\b/.test(raw) || raw === 'I' || raw.endsWith('-I')) return 'P-I';
    if (/\bA\b/.test(raw) || raw === 'A' || raw.endsWith('-A')) return 'P-A';
    if (/\bB\b/.test(raw) || raw === 'B' || raw.endsWith('-B')) return 'P-B';
    if (/\bC\b/.test(raw) || raw === 'C' || raw.endsWith('-C')) return 'P-C';
    return 'P-AA';
  }

  if (point.type === 'felt_roll_upper' || point.type === 'felt_roll_pocket') {
    if (point.tag && /^\d+R$/i.test(point.tag.trim())) {
      return point.tag.trim().toUpperCase();
    }
    const initialMatch = INITIAL_POINTS.find(p => p.id === point.id);
    if (initialMatch && initialMatch.tag && /^\d+R$/i.test(initialMatch.tag.trim())) {
      return initialMatch.tag.trim().toUpperCase();
    }
    const initialFeltPoints = INITIAL_POINTS.filter(p => p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket');
    const idx = initialFeltPoints.findIndex(p => p.id === point.id);
    if (idx !== -1) {
      return `${idx + 1}R`;
    }
    const numMatch = (point.tag || point.name || point.originalLabel || '').match(/(\d+)/);
    if (numMatch) {
      return `${parseInt(numMatch[1], 10)}R`;
    }
    return '1R';
  }

  return '1S';
};

// Helper to get clean Component Name:
// - Piñones: "Piñón Intermedio"
// - Rodillos de lona: "Rodillo de Lona #X" (según el número de la nomenclatura)
// - Secadores: "Secador #X"
export const getCleanComponentName = (point: MeasurementPoint): string => {
  if (point.type === 'felt_roll_upper' || point.type === 'felt_roll_pocket') {
    const nom = getNomenclature(point);
    const numMatch = nom.match(/(\d+)/) 
      || (point.tag || '').match(/(\d+)/) 
      || (point.name || '').match(/#?(\d+)/) 
      || (point.originalLabel || '').match(/(\d+)/);
    if (numMatch) {
      return `Rodillo de Lona #${parseInt(numMatch[1], 10)}`;
    }
    return 'Rodillo de Lona';
  }

  if (point.name && point.name.trim()) {
    let clean = point.name.trim();
    if (/^cilindro\s+secador/i.test(clean)) {
      clean = clean.replace(/^cilindro\s+secador/i, 'Secador');
    }
    return clean;
  }
  if (point.type === 'pinion') {
    return 'Piñón Intermedio';
  }
  return 'Secador';
};

// Helper to get clean Type (e.g. "Secador", "Rodillo", "Piñón")
export const getCleanTypeName = (type: PointType): string => {
  switch (type) {
    case 'dryer':
      return 'Secador';
    case 'felt_roll_upper':
    case 'felt_roll_pocket':
      return 'Rodillo';
    case 'pinion':
      return 'Piñón';
    default:
      return 'Secador';
  }
};

// Roman numeral mapping for pinions P-I to P-XXIX
const ROMAN_MAP: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
  'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18,
  'XIX': 19, 'XX': 20, 'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25,
  'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29
};

// Calculate sort weight for Equipo column:
// 1) Secadores: de menor a mayor (1S, 2S, ... 38S, 48S) -> Range 10,000 to 19,999
// 2) Rodillos: de menor a mayor (1R, 2R, ... 83R) -> Range 20,000 to 29,999
// 3) Piñones: P-AA, P-A, P-B, P-C, P-I a P-XXIX -> Range 30,000 to 39,999
export const getEquipoSortWeight = (point: MeasurementPoint): number => {
  const nom = getNomenclature(point);
  const type = point.type;

  // Group 1: SECADORES (10000+)
  if (type === 'dryer') {
    let num = 0;
    let isSub = 0;
    if (point.originalLabel) {
      const m = point.originalLabel.match(/(\d+)([a-zA-Z]*)/);
      if (m) {
        num = parseInt(m[1], 10);
        if (m[2]) isSub = m[2].toUpperCase().charCodeAt(0) * 0.01;
      }
    }
    if (!num && point.name) {
      const m = point.name.match(/#?(\d+)([a-zA-Z]*)/);
      if (m) {
        num = parseInt(m[1], 10);
        if (m[2]) isSub = m[2].toUpperCase().charCodeAt(0) * 0.01;
      }
    }
    if (!num) {
      const dashM = nom.match(/[-_](\d+)([a-zA-Z]*)$/);
      if (dashM) {
        num = parseInt(dashM[1], 10);
        if (dashM[2]) isSub = dashM[2].toUpperCase().charCodeAt(0) * 0.01;
      } else {
        const genM = nom.match(/(\d+)([a-zA-Z]*)/);
        if (genM) {
          num = parseInt(genM[1], 10);
          if (genM[2]) isSub = genM[2].toUpperCase().charCodeAt(0) * 0.01;
        }
      }
    }
    return 10000 + num * 10 + isSub;
  }

  // Group 2: RODILLOS (20000+)
  if (type === 'felt_roll_upper' || type === 'felt_roll_pocket') {
    let num = 0;
    const m = nom.match(/(\d+)/) || (point.originalLabel ? point.originalLabel.match(/(\d+)/) : null);
    if (m) {
      num = parseInt(m[1], 10);
    }
    return 20000 + num * 10;
  }

  // Group 3: PIÑONES (30000+)
  if (type === 'pinion') {
    const clean = nom.replace(/^P-?/i, '').trim().toUpperCase();
    if (clean === 'AA') return 30000;
    if (clean === 'A') return 30010;
    if (clean === 'B') return 30020;
    if (clean === 'C') return 30030;
    if (ROMAN_MAP[clean] !== undefined) {
      return 30100 + ROMAN_MAP[clean] * 10;
    }
    if (clean === 'N') return 30310;
    if (clean === 'O') return 30320;
    if (clean === 'P') return 30330;
    const numM = clean.match(/\d+/);
    if (numM) {
      return 30500 + parseInt(numM[0], 10) * 10;
    }
    return 30999;
  }

  return 40000;
};

export const PointsTable: React.FC<PointsTableProps> = ({
  points,
  onSelectPoint,
  onUpdatePoints,
  onAddNewPoint,
  onDeletePoint,
  onDeletePointsBulk
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBox, setSelectedBox] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCoverage, setSelectedCoverage] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [bulkTechnician, setBulkTechnician] = useState('');
  // Sorting order for EQUIPO column: 'asc' organizes Secadores -> Rodillos -> Piñones from lowest to highest
  const [equipoSortOrder, setEquipoSortOrder] = useState<'asc' | 'desc' | 'none'>('asc');

  const toggleEquipoSort = () => {
    setEquipoSortOrder(prev => {
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return 'none';
      return 'asc';
    });
  };

  // States for in-app deletion confirmations
  const [pointToDelete, setPointToDelete] = useState<MeasurementPoint | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const handleDeletePoint = (point: MeasurementPoint) => {
    setPointToDelete(point);
  };

  // Coverage statistics across all points (based strictly on SENSOR, CABLE, CONEXION)
  const coverageStats = useMemo(() => {
    let full = 0; // 100% (3/3) - los 3 items (sensor, cable, conexion) están marcados
    let twoThirds = 0; // 67% (2/3)
    let oneThird = 0; // 33% (1/3)
    let zero = 0; // 0% (0/3)
    let pending = 0; // Pendientes (cuando no están los 3 items marcados)

    points.forEach(p => {
      const count = (p.stages?.sensorMounted ? 1 : 0) +
                    (p.stages?.cablePulled ? 1 : 0) +
                    (p.stages?.connectedToJB ? 1 : 0);
      if (count === 3) {
        full++;
      } else {
        pending++;
        if (count === 2) twoThirds++;
        else if (count === 1) oneThird++;
        else zero++;
      }
    });

    return { full, twoThirds, oneThird, zero, pending };
  }, [points]);

  // Helper to determine if a point / equipment is completed (los 3 items: sensor, cable y conexion marcados)
  const isPointDone = (p: MeasurementPoint): boolean => {
    const count = (p.stages?.sensorMounted ? 1 : 0) +
                  (p.stages?.cablePulled ? 1 : 0) +
                  (p.stages?.connectedToJB ? 1 : 0);
    return count === 3;
  };

  const totalCount = points.length;
  const totalDoneCount = useMemo(() => points.filter(isPointDone).length, [points]);

  const dryers = useMemo(() => points.filter(p => p.type === 'dryer'), [points]);
  const dryersCount = dryers.length;
  const dryersDoneCount = useMemo(() => dryers.filter(isPointDone).length, [dryers]);

  const felts = useMemo(() => points.filter(p => p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket'), [points]);
  const feltsCount = felts.length;
  const feltsDoneCount = useMemo(() => felts.filter(isPointDone).length, [felts]);

  const pinions = useMemo(() => points.filter(p => p.type === 'pinion'), [points]);
  const pinionsCount = pinions.length;
  const pinionsDoneCount = useMemo(() => pinions.filter(isPointDone).length, [pinions]);

  // Statistics for Condition: NUEVOS vs VIEJOS
  const conditionStats = useMemo(() => {
    let nuevos = 0;
    let viejos = 0;
    let unassigned = 0;
    points.forEach(p => {
      if (p.condition === 'nuevo') nuevos++;
      else if (p.condition === 'viejo') viejos++;
      else unassigned++;
    });
    return { nuevos, viejos, unassigned, total: points.length };
  }, [points]);

  // Filtered & Sorted Points (organized by default: Secadores menor a mayor -> Rodillos menor a mayor -> Piñones menor a mayor)
  const filteredPoints = useMemo(() => {
    const filtered = points.filter(point => {
      // Box filter
      if (selectedBox !== 'all') {
        if (selectedBox === 'Área Sótano') {
          const isSotano = 
            formatBoxId(point.boxId) === 'Área Sótano' ||
            point.area === 4 ||
            String(point.area).toLowerCase().includes('sotano') ||
            String(point.area).toLowerCase().includes('sótano') ||
            String(point.boxId).toLowerCase().includes('sotano') ||
            String(point.boxId).toLowerCase().includes('sótano');
          if (!isSotano) return false;
        } else {
          const isSotano = 
            formatBoxId(point.boxId) === 'Área Sótano' ||
            point.area === 4 ||
            String(point.area).toLowerCase().includes('sotano') ||
            String(point.area).toLowerCase().includes('sótano');
          if (isSotano) return false;
          if (formatBoxId(point.boxId) !== selectedBox) return false;
        }
      }

      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'dryer' && point.type !== 'dryer') return false;
        if (selectedType === 'felt' && point.type !== 'felt_roll_upper' && point.type !== 'felt_roll_pocket') return false;
        if (selectedType === 'pinion' && point.type !== 'pinion') return false;
      }

      // Condition filter (NUEVO / VIEJO / Sin asignar)
      if (selectedCondition !== 'all') {
        if (selectedCondition === 'nuevo' && point.condition !== 'nuevo') return false;
        if (selectedCondition === 'viejo' && point.condition !== 'viejo') return false;
        if (selectedCondition === 'unassigned' && (point.condition === 'nuevo' || point.condition === 'viejo')) return false;
      }

      // Coverage filter (only SENSOR, CABLE, CONEXION)
      if (selectedCoverage !== 'all') {
        const count = (point.stages.sensorMounted ? 1 : 0) +
                      (point.stages.cablePulled ? 1 : 0) +
                      (point.stages.connectedToJB ? 1 : 0);
        const percent = Math.round((count / 3) * 100);
        if (selectedCoverage === '100' && count !== 3) return false;
        if ((selectedCoverage === 'pending' || selectedCoverage === '0' || selectedCoverage === 'incomplete') && count === 3) return false;
        if (selectedCoverage === '67' && percent !== 67) return false;
        if (selectedCoverage === '33' && percent !== 33) return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nomenclature = getNomenclature(point).toLowerCase();
        const compName = getCleanComponentName(point).toLowerCase();
        const typeName = getCleanTypeName(point.type).toLowerCase();
        const matchesSerial = (point.sensorSerial || '').toLowerCase().includes(query);
        const matchesTech = (point.technician || '').toLowerCase().includes(query);
        const matchesBox = point.boxId.toLowerCase().includes(query);
        const matchesChannel = `ch-${point.boxChannel}`.toLowerCase().includes(query) || `${point.boxChannel}`.includes(query);

        if (!nomenclature.includes(query) && 
            !compName.includes(query) && 
            !typeName.includes(query) && 
            !matchesSerial && 
            !matchesTech && 
            !matchesBox && 
            !matchesChannel) {
          return false;
        }
      }

      return true;
    });

    if (equipoSortOrder === 'asc') {
      return [...filtered].sort((a, b) => getEquipoSortWeight(a) - getEquipoSortWeight(b));
    }
    if (equipoSortOrder === 'desc') {
      return [...filtered].sort((a, b) => getEquipoSortWeight(b) - getEquipoSortWeight(a));
    }

    return filtered;
  }, [points, selectedBox, selectedType, selectedCoverage, selectedCondition, searchTerm, equipoSortOrder]);

  // Bulk selection toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPointIds(filteredPoints.map(p => p.id));
    } else {
      setSelectedPointIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedPointIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle mounting type between 'disco' and 'perforacion' (only one can apply, or none)
  const handleSelectMountingType = (pointId: string, type: 'disco' | 'perforacion') => {
    const updated = points.map(p => {
      if (p.id === pointId) {
        const nextType = p.mountingType === type ? null : type;
        return {
          ...p,
          mountingType: nextType
        };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Toggle condition between 'nuevo' and 'viejo' (mutually exclusive)
  const handleSelectCondition = (pointId: string, condition: 'nuevo' | 'viejo') => {
    const updated = points.map(p => {
      if (p.id === pointId) {
        const nextCondition = p.condition === condition ? null : condition;
        return {
          ...p,
          condition: nextCondition
        };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Bulk set mounting type
  const applyBulkMounting = (type: 'disco' | 'perforacion' | 'clear') => {
    if (selectedPointIds.length === 0) return;
    const updated = points.map(p => {
      if (selectedPointIds.includes(p.id)) {
        return {
          ...p,
          mountingType: type === 'clear' ? null : type
        };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Bulk set condition (nuevo / viejo)
  const applyBulkCondition = (condition: 'nuevo' | 'viejo' | 'clear') => {
    if (selectedPointIds.length === 0) return;
    const updated = points.map(p => {
      if (selectedPointIds.includes(p.id)) {
        return {
          ...p,
          condition: condition === 'clear' ? null : condition
        };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Toggle single installation milestone directly in the table
  const handleToggleMilestone = (pointId: string, milestone: 'sensor' | 'cable' | 'conexion' | 'bias') => {
    const updated = points.map(p => {
      if (p.id === pointId) {
        const stages = { ...p.stages };
        let biasVoltage = p.biasVoltage;

        if (milestone === 'sensor') {
          const nextVal = !stages.sensorMounted;
          stages.sensorMounted = nextVal;
          stages.baseMachined = nextVal;
        } else if (milestone === 'cable') {
          const nextVal = !stages.cablePulled;
          stages.cablePulled = nextVal;
          stages.conduitInstalled = nextVal;
        } else if (milestone === 'conexion') {
          stages.connectedToJB = !stages.connectedToJB;
        } else if (milestone === 'bias') {
          const nextVal = !stages.biasVerified;
          stages.biasVerified = nextVal;
          stages.vibrationTestOk = nextVal;
          if (nextVal && (!biasVoltage || biasVoltage === 0)) {
            biasVoltage = 12.0;
          }
        }

        // Recalculate coverage and status (only SENSOR, CABLE, CONEXION count for coverage)
        const count = (stages.sensorMounted ? 1 : 0) +
                      (stages.cablePulled ? 1 : 0) +
                      (stages.connectedToJB ? 1 : 0);

        let newStatus: PointStatus = 'pending';
        if (count === 3) newStatus = 'verified';
        else if (count === 2) newStatus = 'installed';
        else if (count === 1) newStatus = 'in_progress';
        else newStatus = 'pending';

        return {
          ...p,
          stages,
          biasVoltage,
          status: newStatus,
          installedDate: count > 0 && !p.installedDate ? new Date().toISOString().split('T')[0] : p.installedDate
        };
      }
      return p;
    });

    onUpdatePoints(updated);
  };

  // Bulk actions for multiple selected points
  const applyBulkMilestone = (milestone: 'sensor' | 'cable' | 'conexion' | 'bias' | 'all', value: boolean) => {
    if (selectedPointIds.length === 0) return;

    const updated = points.map(p => {
      if (selectedPointIds.includes(p.id)) {
        const stages = { ...p.stages };
        let biasVoltage = p.biasVoltage;

        if (milestone === 'sensor' || milestone === 'all') {
          stages.sensorMounted = value;
          stages.baseMachined = value;
        }
        if (milestone === 'cable' || milestone === 'all') {
          stages.cablePulled = value;
          stages.conduitInstalled = value;
        }
        if (milestone === 'conexion' || milestone === 'all') {
          stages.connectedToJB = value;
        }
        if (milestone === 'bias' || milestone === 'all') {
          stages.biasVerified = value;
          stages.vibrationTestOk = value;
          if (value && (!biasVoltage || biasVoltage === 0)) {
            biasVoltage = 12.0;
          }
        }

        // Only SENSOR, CABLE, CONEXION count for coverage
        const count = (stages.sensorMounted ? 1 : 0) +
                      (stages.cablePulled ? 1 : 0) +
                      (stages.connectedToJB ? 1 : 0);

        let newStatus: PointStatus = 'pending';
        if (count === 3) newStatus = 'verified';
        else if (count === 2) newStatus = 'installed';
        else if (count === 1) newStatus = 'in_progress';
        else newStatus = 'pending';

        return {
          ...p,
          stages,
          biasVoltage,
          status: newStatus,
          installedDate: count > 0 && !p.installedDate ? new Date().toISOString().split('T')[0] : p.installedDate
        };
      }
      return p;
    });

    onUpdatePoints(updated);
  };

  const applyBulkTechnician = () => {
    if (selectedPointIds.length === 0 || !bulkTechnician.trim()) return;
    const updated = points.map(p => {
      if (selectedPointIds.includes(p.id)) {
        return {
          ...p,
          technician: bulkTechnician.trim()
        };
      }
      return p;
    });
    onUpdatePoints(updated);
    setBulkTechnician('');
  };

  // Quick change Area for a single point
  const handleQuickChangeArea = (pointId: string, newAreaStr: string) => {
    let newArea: 1 | 2 | 3 | 4 = 1;
    let newBox: BoxId = 'JB #1';
    if (newAreaStr === '4' || newAreaStr === 'sotano') {
      newArea = 4;
      newBox = 'Área Sótano';
    } else if (newAreaStr === '2') {
      newArea = 2;
      newBox = 'JB #2';
    } else if (newAreaStr === '3') {
      newArea = 3;
      newBox = 'JB #3';
    } else {
      newArea = 1;
      newBox = 'JB #1';
    }

    const updated = points.map(p => {
      if (p.id === pointId) {
        return {
          ...p,
          area: newArea,
          boxId: newBox
        };
      }
      return p;
    });

    onUpdatePoints(updated);
  };

  // Bulk move points to an Area
  const applyBulkArea = (newAreaNum: 1 | 2 | 3 | 4) => {
    if (selectedPointIds.length === 0) return;
    let newBox: BoxId = 'JB #1';
    if (newAreaNum === 4) newBox = 'Área Sótano';
    else if (newAreaNum === 2) newBox = 'JB #2';
    else if (newAreaNum === 3) newBox = 'JB #3';
    else newBox = 'JB #1';

    const updated = points.map(p => {
      if (selectedPointIds.includes(p.id)) {
        return {
          ...p,
          area: newAreaNum,
          boxId: newBox
        };
      }
      return p;
    });

    onUpdatePoints(updated);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Equipo',
      'Descripcion',
      'Tipo',
      'Caja',
      'CH',
      'Sensor Instalado',
      'Cable Instalado',
      'Conexion JB',
      'Bias VDC',
      'Nuevo',
      'Viejo',
      'Disco Montaje',
      'Perforacion',
      'Cubrimiento %',
      'Serial Sensor',
      'Tecnico',
      'Fecha'
    ];

    const rows = filteredPoints.map(p => {
      const s = p.stages;
      const count = (s.sensorMounted ? 1 : 0) + (s.cablePulled ? 1 : 0) + (s.connectedToJB ? 1 : 0);
      const percent = Math.round((count / 3) * 100);

      return [
        `"${getNomenclature(p)}"`,
        `"${getCleanComponentName(p)}"`,
        `"${getCleanTypeName(p.type)}"`,
        `"${p.boxId}"`,
        p.boxChannel,
        s.sensorMounted ? 'SI' : 'NO',
        s.cablePulled ? 'SI' : 'NO',
        s.connectedToJB ? 'SI' : 'NO',
        p.biasVoltage !== undefined ? p.biasVoltage : '',
        p.condition === 'nuevo' ? 'SI' : 'NO',
        p.condition === 'viejo' ? 'SI' : 'NO',
        p.mountingType === 'disco' ? 'SI' : 'NO',
        p.mountingType === 'perforacion' ? 'SI' : 'NO',
        `"${percent}%"`,
        `"${p.sensorSerial || ''}"`,
        `"${p.technician || ''}"`,
        `"${p.installedDate || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Listado_Medicion_Vibracion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a clean coverage percent badge (considering only SENSOR, CABLE, CONEXION)
  const renderCoverageBadge = (count: number) => {
    const percent = Math.round((count / 3) * 100);

    if (percent === 100) {
      return (
        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
          100%
        </span>
      );
    }

    if (percent === 67) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-black bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
          67%
        </span>
      );
    }

    if (percent === 33) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          33%
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 shadow-2xs">
        0%
      </span>
    );
  };

  // Render Table Rows for a set of points
  const renderPointRows = (pointsList: MeasurementPoint[]) => {
    if (pointsList.length === 0) {
      return (
        <tr>
          <td colSpan={16} className="p-8 text-center text-slate-400 text-xs">
            No se encontraron componentes con los filtros seleccionados.
          </td>
        </tr>
      );
    }

    return pointsList.map((point, idx) => {
      const isSelected = selectedPointIds.includes(point.id);
      const stages = point.stages;
      const count = (stages.sensorMounted ? 1 : 0) +
                    (stages.cablePulled ? 1 : 0) +
                    (stages.connectedToJB ? 1 : 0);

      const nomenclature = getNomenclature(point);
      const componentName = getCleanComponentName(point);
      const typeName = getCleanTypeName(point.type);

      return (
        <tr 
          key={point.id ? `${point.id}_${idx}` : `point-row-${idx}`}
          id={`point-row-${point.id}`}
          className={`hover:bg-slate-50/80 transition-colors border-b border-slate-200 text-xs ${isSelected ? 'bg-sky-50/40' : 'bg-white'}`}
        >
          {/* Select Checkbox */}
          <td className="px-2 py-2 text-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectOne(point.id)}
              className="rounded text-sky-600 h-4 w-4 cursor-pointer"
            />
          </td>

          {/* 1. EQUIPO */}
          <td className="px-2 py-2 text-center whitespace-nowrap">
            <button
              onClick={() => onSelectPoint(point)}
              className="font-mono text-xs font-black text-sky-700 hover:text-sky-900 hover:underline tracking-tight cursor-pointer"
              title="Clic para ver ficha técnica y observaciones"
            >
              {nomenclature}
            </button>
          </td>

          {/* 2. DESCRIPCIÓN */}
          <td className="px-2.5 py-2 text-center">
            <div className="font-bold text-slate-900 text-xs leading-tight">
              {componentName}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {point.area === 4 || String(point.area).toLowerCase().includes('sotano')
                ? 'Área Sótano'
                : `Área ${point.area || 1}`}
            </div>
          </td>

          {/* 3. TIPO */}
          <td className="px-2 py-2 text-center whitespace-nowrap">
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
              point.type === 'dryer' 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : point.type === 'pinion'
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
            }`}>
              {typeName}
            </span>
          </td>

          {/* 4. CAJA */}
          <td className="px-2 py-2 font-mono text-xs text-center whitespace-nowrap">
            <span className="font-bold text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
              {formatBoxId(point.boxId)}
            </span>
          </td>

          {/* 5. CH */}
          <td className="px-2 py-2 font-mono text-xs text-center whitespace-nowrap">
            <span className="text-slate-700 font-semibold px-1.5 py-0.5 rounded bg-slate-100/70 border border-slate-200 text-[11px]">
              CH-{String(point.boxChannel).padStart(2, '0')}
            </span>
          </td>

          {/* 6. SENSOR (Círculo sin letras) */}
          <td className="px-1 py-2 text-center">
            <button
              type="button"
              id={`toggle-sensor-${point.id}`}
              onClick={() => handleToggleMilestone(point.id, 'sensor')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                stages.sensorMounted
                  ? 'bg-emerald-600 border-2 border-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
                  : 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
              title={stages.sensorMounted ? 'Sensor instalado (clic para desmarcar)' : 'Marcar sensor como instalado'}
              aria-label="Sensor instalado"
            >
              {stages.sensorMounted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 7. CABLE (Círculo sin letras) */}
          <td className="px-1 py-2 text-center">
            <button
              type="button"
              id={`toggle-cable-${point.id}`}
              onClick={() => handleToggleMilestone(point.id, 'cable')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                stages.cablePulled
                  ? 'bg-emerald-600 border-2 border-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
                  : 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
              title={stages.cablePulled ? 'Cable tendido (clic para desmarcar)' : 'Marcar cable como instalado'}
              aria-label="Cable instalado"
            >
              {stages.cablePulled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 8. CONEXION (Círculo sin letras) */}
          <td className="px-1 py-2 text-center">
            <button
              type="button"
              id={`toggle-conexion-${point.id}`}
              onClick={() => handleToggleMilestone(point.id, 'conexion')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                stages.connectedToJB
                  ? 'bg-emerald-600 border-2 border-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
                  : 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
              title={stages.connectedToJB ? 'Conexión a JB lista (clic para desmarcar)' : 'Marcar conexión a bornera completada'}
              aria-label="Conexión lista"
            >
              {stages.connectedToJB && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 9. BIAS (Solo valor en voltios registrado manualmente) */}
          <td className="px-2 py-2 text-center font-mono">
            {point.biasVoltage !== undefined && point.biasVoltage !== null && !isNaN(point.biasVoltage) && point.biasVoltage > 0 ? (
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                {point.biasVoltage.toFixed(1)} V
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">--</span>
            )}
          </td>

          {/* NUEVO */}
          <td className="px-2 py-2 text-center">
            <button
              type="button"
              id={`toggle-nuevo-${point.id}`}
              onClick={() => handleSelectCondition(point.id, 'nuevo')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                point.condition === 'nuevo'
                  ? 'bg-emerald-600 border-2 border-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 ring-2 ring-emerald-200'
                  : 'bg-white border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
              }`}
              title={point.condition === 'nuevo' ? 'Marcado como NUEVO (clic para desmarcar)' : 'Seleccionar NUEVO'}
              aria-label="Condición Nuevo"
            >
              {point.condition === 'nuevo' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* VIEJO */}
          <td className="px-2 py-2 text-center">
            <button
              type="button"
              id={`toggle-viejo-${point.id}`}
              onClick={() => handleSelectCondition(point.id, 'viejo')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                point.condition === 'viejo'
                  ? 'bg-amber-600 border-2 border-amber-600 text-white hover:bg-amber-700 hover:scale-105 ring-2 ring-amber-200'
                  : 'bg-white border-2 border-slate-300 hover:border-amber-500 hover:bg-amber-50/50'
              }`}
              title={point.condition === 'viejo' ? 'Marcado como VIEJO (clic para desmarcar)' : 'Seleccionar VIEJO'}
              aria-label="Condición Viejo"
            >
              {point.condition === 'viejo' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 10. DISCO MONTAJE */}
          <td className="px-2 py-2 text-center">
            <button
              type="button"
              id={`toggle-disco-${point.id}`}
              onClick={() => handleSelectMountingType(point.id, 'disco')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                point.mountingType === 'disco'
                  ? 'bg-sky-600 border-2 border-sky-600 text-white hover:bg-sky-700 hover:scale-105 ring-2 ring-sky-200'
                  : 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
              title={point.mountingType === 'disco' ? 'Disco de Montaje seleccionado (clic para desmarcar)' : 'Seleccionar Disco de Montaje'}
              aria-label="Disco de Montaje"
            >
              {point.mountingType === 'disco' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 11. PERFORACION */}
          <td className="px-2 py-2 text-center">
            <button
              type="button"
              id={`toggle-perforacion-${point.id}`}
              onClick={() => handleSelectMountingType(point.id, 'perforacion')}
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                point.mountingType === 'perforacion'
                  ? 'bg-sky-600 border-2 border-sky-600 text-white hover:bg-sky-700 hover:scale-105 ring-2 ring-sky-200'
                  : 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50'
              }`}
              title={point.mountingType === 'perforacion' ? 'Perforación seleccionada (clic para desmarcar)' : 'Seleccionar Perforación'}
              aria-label="Perforación"
            >
              {point.mountingType === 'perforacion' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </td>

          {/* 12. CUBRIMIENTO (%) */}
          <td className="px-2 py-2 font-mono text-center">
            {renderCoverageBadge(count)}
          </td>

          {/* 13. ACCIÓN */}
          <td className="px-2 py-2 text-center whitespace-nowrap">
            <div className="flex items-center justify-center gap-1">
              <button
                id={`edit-point-btn-${point.id}`}
                onClick={() => onSelectPoint(point)}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors inline-flex items-center justify-center shadow-xs cursor-pointer"
                title={`Diligenciar ficha técnica ${nomenclature}`}
                aria-label={`Diligenciar ficha técnica ${nomenclature}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                id={`delete-point-btn-${point.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePoint(point);
                }}
                className="p-1.5 rounded-md text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
                title={`Eliminar punto ${nomenclature}`}
                aria-label={`Eliminar punto ${nomenclature}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  // Groupings for segmented views
  const groupedByType = useMemo(() => {
    return [
      {
        title: 'SECADORES',
        badge: '1S-48S',
        description: 'Secadores de vapor para secado de la hoja de papel',
        points: filteredPoints.filter(p => p.type === 'dryer')
      },
      {
        title: 'RODILLOS',
        badge: '1R-83R',
        description: 'Rodillos tensores, guía y de retorno de telas secadoras',
        points: filteredPoints.filter(p => p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket')
      },
      {
        title: 'PIÑONES',
        badge: 'P-AA a P-XXIX',
        description: 'Piñones impulsor e intermedios para sincronización cinemática',
        points: filteredPoints.filter(p => p.type === 'pinion')
      }
    ];
  }, [filteredPoints]);

  const groupedByBox = useMemo(() => {
    return [
      {
        title: 'Caja Conexiones - JB #1',
        badge: 'JB #1',
        description: 'Puntos de medición cableados a JB #1 (Área 1)',
        points: filteredPoints.filter(p => formatBoxId(p.boxId) === 'JB #1' && p.area !== 4 && !String(p.area).toLowerCase().includes('sotano'))
      },
      {
        title: 'Caja Conexiones - JB #2',
        badge: 'JB #2',
        description: 'Puntos de medición cableados a JB #2 (Área 2)',
        points: filteredPoints.filter(p => formatBoxId(p.boxId) === 'JB #2' && p.area !== 4 && !String(p.area).toLowerCase().includes('sotano'))
      },
      {
        title: 'Caja Conexiones - JB #3',
        badge: 'JB #3',
        description: 'Puntos de medición cableados a JB #3 (Área 3)',
        points: filteredPoints.filter(p => formatBoxId(p.boxId) === 'JB #3' && p.area !== 4 && !String(p.area).toLowerCase().includes('sotano'))
      },
      {
        title: 'Caja Conexiones - Área Sótano',
        badge: 'Área Sótano',
        description: 'Puntos de medición asignados a Área Sótano',
        points: filteredPoints.filter(p => formatBoxId(p.boxId) === 'Área Sótano' || p.area === 4 || String(p.area).toLowerCase().includes('sotano') || String(p.boxId).toLowerCase().includes('sotano'))
      }
    ];
  }, [filteredPoints]);

  return (
    <div id="points-table-container" className="space-y-4">
      {/* KPI Counters Banner: Total de equipos y enseguida cuántos se han hecho en cada recuadro */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Recuadro 1: Total Componentes */}
        <button
          type="button"
          onClick={() => { setSelectedType('all'); setSelectedCoverage('all'); setSelectedCondition('all'); }}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedType === 'all' && selectedCoverage === 'all' && selectedCondition === 'all'
              ? 'bg-slate-100 border-slate-400 ring-1 ring-slate-400'
              : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Ver todos los componentes"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate block">
              Total Componentes
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
              {Math.round((totalDoneCount / (totalCount || 1)) * 100)}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Total de componentes en planta">
              <span className="font-mono text-xl font-black text-slate-900">{totalCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">total</span>
            </div>

            <div className="flex items-baseline gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 shadow-2xs" title="Total componentes completados">
              <span className="font-mono text-sm font-black text-emerald-800">{totalDoneCount}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((totalDoneCount / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </button>

        {/* Recuadro 2: SECADORES */}
        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'dryer' ? 'all' : 'dryer')}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedType === 'dryer' ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Filtrar por Secadores (1S a 48S)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-tight block">
              SECADORES
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/60">
              {Math.round((dryersDoneCount / (dryersCount || 1)) * 100)}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Total de secadores">
              <span className="font-mono text-xl font-black text-amber-950">{dryersCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">total</span>
            </div>

            <div className="flex items-baseline gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 shadow-2xs" title="Secadores completados">
              <span className="font-mono text-sm font-black text-emerald-800">{dryersDoneCount}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((dryersDoneCount / (dryersCount || 1)) * 100)}%` }}
            />
          </div>
        </button>

        {/* Recuadro 3: RODILLOS */}
        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'felt' ? 'all' : 'felt')}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedType === 'felt' ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Filtrar por Rodillos de Lona (1R a 83R)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-tight block">
              RODILLOS
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-100/70 px-1.5 py-0.5 rounded border border-sky-200/60">
              {Math.round((feltsDoneCount / (feltsCount || 1)) * 100)}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Total de rodillos de lona">
              <span className="font-mono text-xl font-black text-sky-950">{feltsCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">total</span>
            </div>

            <div className="flex items-baseline gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 shadow-2xs" title="Rodillos completados">
              <span className="font-mono text-sm font-black text-emerald-800">{feltsDoneCount}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((feltsDoneCount / (feltsCount || 1)) * 100)}%` }}
            />
          </div>
        </button>

        {/* Recuadro 4: PIÑONES */}
        <button
          type="button"
          onClick={() => setSelectedType(selectedType === 'pinion' ? 'all' : 'pinion')}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedType === 'pinion' ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-400' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Filtrar por Piñones (P-AA, P-A a P-XXIX)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-tight block">
              PIÑONES
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded border border-purple-200/60">
              {Math.round((pinionsDoneCount / (pinionsCount || 1)) * 100)}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Total de piñones intermedios">
              <span className="font-mono text-xl font-black text-purple-950">{pinionsCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">total</span>
            </div>

            <div className="flex items-baseline gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 shadow-2xs" title="Piñones completados">
              <span className="font-mono text-sm font-black text-emerald-800">{pinionsDoneCount}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((pinionsDoneCount / (pinionsCount || 1)) * 100)}%` }}
            />
          </div>
        </button>

        {/* Recuadro 5: CONDICIÓN (NUEVOS Y VIEJOS) */}
        <div
          id="kpi-card-condicion-nuevo-viejo"
          className={`p-3 rounded-xl border text-left transition-all shadow-xs flex flex-col justify-between ${
            selectedCondition !== 'all'
              ? 'bg-sky-50/70 border-sky-400 ring-1 ring-sky-400'
              : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Cuenta de componentes Nuevos vs Viejos. Clic en Nuevos o Viejos para filtrar."
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tight block">
              NUEVO / VIEJO
            </span>
            <span 
              className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" 
              title="Equipos clasificados del total"
            >
              {conditionStats.nuevos + conditionStats.viejos}/{totalCount}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {/* Sub-recuadro NUEVOS */}
            <button
              type="button"
              id="kpi-filter-nuevo-btn"
              onClick={() => setSelectedCondition(selectedCondition === 'nuevo' ? 'all' : 'nuevo')}
              className={`flex items-baseline justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedCondition === 'nuevo'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-1 ring-emerald-300 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
              }`}
              title="Clic para ver solo componentes NUEVOS"
            >
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-black leading-none">{conditionStats.nuevos}</span>
                <span className="text-[9.5px] uppercase font-bold tracking-tight">Nuevos</span>
              </div>
            </button>

            {/* Sub-recuadro VIEJOS */}
            <button
              type="button"
              id="kpi-filter-viejo-btn"
              onClick={() => setSelectedCondition(selectedCondition === 'viejo' ? 'all' : 'viejo')}
              className={`flex items-baseline justify-between px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedCondition === 'viejo'
                  ? 'bg-amber-600 text-white border-amber-600 ring-1 ring-amber-300 shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
              }`}
              title="Clic para ver solo componentes VIEJOS"
            >
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-black leading-none">{conditionStats.viejos}</span>
                <span className="text-[9.5px] uppercase font-bold tracking-tight">Viejos</span>
              </div>
            </button>
          </div>

          {/* Barra de progreso combinada: Verde (Nuevos) + Ámbar (Viejos) */}
          <div 
            className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2 flex" 
            title={`Nuevos: ${conditionStats.nuevos}, Viejos: ${conditionStats.viejos}, Sin clasificar: ${conditionStats.unassigned}`}
          >
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(conditionStats.nuevos / (totalCount || 1)) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(conditionStats.viejos / (totalCount || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Recuadro 6: 100% Cubrimiento */}
        <button
          type="button"
          onClick={() => setSelectedCoverage(selectedCoverage === '100' ? 'all' : '100')}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedCoverage === '100' ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Filtrar componentes con 100% de cubrimiento (3/3 etapas completadas)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight block">
              100% Cubrimiento
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/60">
              {Math.round((coverageStats.full / (totalCount || 1)) * 100)}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Equipos finalizados al 100%">
              <span className="font-mono text-xl font-black text-emerald-950">{coverageStats.full}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">listos</span>
            </div>

            <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 shadow-2xs" title="De total general de equipos">
              <span className="text-[10px] font-semibold text-slate-500">de</span>
              <span className="font-mono text-xs font-black text-slate-800">{totalCount}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round((coverageStats.full / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </button>

        {/* Recuadro 6: PENDIENTES */}
        <button
          type="button"
          onClick={() => setSelectedCoverage(selectedCoverage === 'pending' || selectedCoverage === '0' ? 'all' : 'pending')}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between ${
            selectedCoverage === 'pending' || selectedCoverage === '0' ? 'bg-slate-100 border-slate-400 ring-1 ring-slate-400' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
          title="Filtrar componentes pendientes (falta sensor, cable o conexión)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight block">
              PENDIENTES
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1" title="Equipos pendientes de completar los 3 items">
              <span className="font-mono text-xl font-black text-slate-800">{coverageStats.pending}</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-slate-400 h-full rounded-full transition-all"
              style={{ width: `${Math.round((coverageStats.pending / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Listado General</span>
                <button
                  type="button"
                  id="toggle-equipo-sort-btn"
                  onClick={toggleEquipoSort}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                    equipoSortOrder === 'asc'
                      ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                      : equipoSortOrder === 'desc'
                        ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Organizar columna EQUIPO: Secadores → Rodillos → Piñones (de menor a mayor)"
                >
                  {equipoSortOrder === 'asc' ? (
                    <ArrowUp className="w-3.5 h-3.5 text-sky-600 stroke-[2.5]" />
                  ) : equipoSortOrder === 'desc' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-purple-600 stroke-[2.5]" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Equipo: </span>
                  <span className="font-bold">
                    {equipoSortOrder === 'asc' ? 'Secadores → Rodillos → Piñones' : equipoSortOrder === 'desc' ? 'Mayor a Menor' : 'Original'}
                  </span>
                </button>
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Avance físico por componente:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded">
                  <Cpu className="w-3 h-3 text-sky-600" /> Sensor
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded">
                  <Zap className="w-3 h-3 text-purple-600" /> Cable
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                  <Package className="w-3 h-3 text-amber-600" /> Conexión
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Switcher */}
              <div className="bg-slate-200 p-0.5 rounded-lg flex items-center text-xs font-medium text-slate-700">
                <button
                  id="view-mode-table-btn"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver como tabla general corrida"
                >
                  <List className="w-3.5 h-3.5" />
                  Tabla Corrida
                </button>
                <button
                  id="view-mode-grouped-type-btn"
                  onClick={() => setViewMode('grouped_type')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grouped_type' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Agrupar por Secador, Lona y Piñón"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Por Tipo
                </button>
                <button
                  id="view-mode-grouped-box-btn"
                  onClick={() => setViewMode('grouped_box')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grouped_box' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Agrupar por Caja de Conexiones JB"
                >
                  <Box className="w-3.5 h-3.5" />
                  Por Caja JB
                </button>
              </div>

              {/* Export CSV button */}
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Descargar listado completo en archivo CSV para Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Exportar CSV
              </button>

              {/* Add New Point Button */}
              <button
                id="add-new-point-btn"
                onClick={onAddNewPoint}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Componente
              </button>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-points-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar componente, técnico, canal..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Filter by Type */}
            <div>
              <select
                id="filter-point-type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Todos los Tipos</option>
                <option value="dryer">SECADORES</option>
                <option value="felt">RODILLOS</option>
                <option value="pinion">PIÑONES</option>
              </select>
            </div>

            {/* Filter by Box */}
            <div>
              <select
                id="filter-box-select"
                value={selectedBox}
                onChange={(e) => setSelectedBox(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="all">Todas las Cajas Conexiones</option>
                <option value="JB #1">JB #1 (Área 1)</option>
                <option value="JB #2">JB #2 (Área 2)</option>
                <option value="JB #3">JB #3 (Área 3)</option>
                <option value="Área Sótano">Área Sótano</option>
              </select>
            </div>

            {/* Filter by Condition (NUEVO / VIEJO) */}
            <div>
              <select
                id="filter-point-condition-select"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Condición: Todos ({totalCount})</option>
                <option value="nuevo">Condición: NUEVOS ({conditionStats.nuevos})</option>
                <option value="viejo">Condición: VIEJOS ({conditionStats.viejos})</option>
                <option value="unassigned">Sin Clasificar ({conditionStats.unassigned})</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Actions Panel */}
          {selectedPointIds.length > 0 && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-sky-950">
                {selectedPointIds.length} componentes seleccionados:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => applyBulkMilestone('sensor', true)}
                  className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-800 border border-slate-300 hover:border-sky-300 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Marcar sensor instalado para seleccionados"
                >
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  <span>+ Sensor</span>
                </button>
                <button
                  onClick={() => applyBulkMilestone('cable', true)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-800 border border-slate-300 hover:border-purple-300 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Marcar cable tendido para seleccionados"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Cable</span>
                </button>
                <button
                  onClick={() => applyBulkMilestone('conexion', true)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-800 border border-slate-300 hover:border-amber-300 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Marcar conexión realizada para seleccionados"
                >
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Conexión</span>
                </button>
                <button
                  onClick={() => applyBulkMilestone('bias', true)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded font-medium transition-colors cursor-pointer"
                >
                  + Bias
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkCondition('nuevo')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded font-medium transition-colors cursor-pointer"
                  title="Marcar seleccionados como NUEVO"
                >
                  + Nuevo
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkCondition('viejo')}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-medium transition-colors cursor-pointer"
                  title="Marcar seleccionados como VIEJO"
                >
                  + Viejo
                </button>
                <button
                  onClick={() => applyBulkMounting('disco')}
                  className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded font-medium transition-colors cursor-pointer"
                  title="Asignar Disco de Montaje a seleccionados"
                >
                  + Disco
                </button>
                <button
                  onClick={() => applyBulkMounting('perforacion')}
                  className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded font-medium transition-colors cursor-pointer"
                  title="Asignar Perforación a seleccionados"
                >
                  + Perforación
                </button>
                <button
                  onClick={() => applyBulkMilestone('all', true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors cursor-pointer ml-1"
                >
                  Marcar 100% Cubrimiento
                </button>

                {/* Mover Área en masa */}
                <div className="flex items-center gap-1 bg-white border border-sky-300 rounded-lg px-2 py-0.5 ml-1 shadow-2xs">
                  <span className="text-[11px] text-sky-950 font-bold">Mover Área:</span>
                  <button
                    type="button"
                    onClick={() => applyBulkArea(1)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Área 1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkArea(2)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Área 2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkArea(3)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Área 3
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkArea(4)}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Mover equipos seleccionados a Área Sótano"
                  >
                    Área Sótano
                  </button>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="text"
                    placeholder="Técnico..."
                    value={bulkTechnician}
                    onChange={(e) => setBulkTechnician(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-28 text-slate-800"
                  />
                  <button
                    onClick={applyBulkTechnician}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium cursor-pointer"
                  >
                    Asignar
                  </button>
                </div>

                <button
                  id="bulk-delete-points-btn"
                  type="button"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-semibold transition-colors cursor-pointer ml-auto flex items-center gap-1.5 shadow-2xs"
                  title="Eliminar puntos de medición seleccionados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Eliminar ({selectedPointIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedPointIds([])}
                  className="text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Content: TABLE MODE */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase text-[10px] sm:text-[10.5px] leading-tight select-none">
                <tr>
                  <th className="p-2 w-9 text-center">
                    <input
                      type="checkbox"
                      checked={selectedPointIds.length > 0 && selectedPointIds.length === filteredPoints.length}
                      onChange={handleSelectAll}
                      className="rounded text-sky-600 h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th 
                    id="col-header-equipo"
                    className="px-2 py-2 text-center whitespace-nowrap min-w-[85px] cursor-pointer hover:bg-slate-200/90 transition-colors select-none group"
                    onClick={toggleEquipoSort}
                    title={
                      equipoSortOrder === 'asc'
                        ? 'Orden: De menor a mayor (Secadores 1S..48S → Rodillos 1R..83R → Piñones P-AA..P-XXIX). Clic para ordenar de mayor a menor.'
                        : equipoSortOrder === 'desc'
                          ? 'Orden: De mayor a menor (Piñones → Rodillos → Secadores). Clic para orden original.'
                          : 'Clic para organizar de menor a mayor (Secadores → Rodillos → Piñones)'
                    }
                  >
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <span className="font-bold">EQUIPO</span>
                      <span className="inline-flex items-center">
                        {equipoSortOrder === 'asc' && (
                          <span className="flex items-center text-sky-700 bg-sky-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-sky-300 shadow-2xs" title="Menor a mayor: Secadores → Rodillos → Piñones">
                            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                            <span className="ml-0.5">1-9</span>
                          </span>
                        )}
                        {equipoSortOrder === 'desc' && (
                          <span className="flex items-center text-purple-700 bg-purple-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-purple-300 shadow-2xs" title="Mayor a menor">
                            <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                            <span className="ml-0.5">9-1</span>
                          </span>
                        )}
                        {equipoSortOrder === 'none' && (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-2.5 py-2 text-center min-w-[125px]">DESCRIPCIÓN</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">TIPO</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">CAJA</th>
                  <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">CH</th>
                  <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Sensor instalado">
                    <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-sky-100 transition-colors" title="Sensor instalado">
                      <Cpu className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </th>
                  <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Cable tendido">
                    <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-purple-100 transition-colors" title="Cable tendido">
                      <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </th>
                  <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Conexión en caja de conexiones">
                    <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-amber-100 transition-colors" title="Conexión en caja de conexiones">
                      <Package className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </th>
                  <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">BIAS</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">NUEVO</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">VIEJO</th>
                  <th className="px-2 py-1.5 text-center min-w-[70px]">
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <span>DISCO</span>
                      <span>MONTAJE</span>
                    </div>
                  </th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[80px]">PERFORACION</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[50px] font-black text-xs text-slate-900">%</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap min-w-[70px]">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {renderPointRows(filteredPoints)}
              </tbody>
            </table>
          </div>
        )}

        {/* View Content: GROUPED BY MECHANICAL TYPE */}
        {viewMode === 'grouped_type' && (
          <div className="p-4 sm:p-6 space-y-6">
            {groupedByType.map((group, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {group.badge}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{group.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 bg-white border border-slate-300 rounded-full text-slate-700">
                      Total: <strong>{group.points.length}</strong>
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800" title="Completados">
                      <strong>{group.points.filter(isPointDone).length}</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] sm:text-[10.5px] leading-tight select-none">
                      <tr>
                        <th className="p-2 w-9 text-center">Sel</th>
                        <th 
                          className="px-2 py-2 text-center whitespace-nowrap min-w-[85px] cursor-pointer hover:bg-slate-200/90 transition-colors select-none group"
                          onClick={toggleEquipoSort}
                          title={
                            equipoSortOrder === 'asc'
                              ? 'Orden: De menor a mayor. Clic para ordenar de mayor a menor.'
                              : equipoSortOrder === 'desc'
                                ? 'Orden: De mayor a menor. Clic para orden original.'
                                : 'Clic para organizar de menor a mayor'
                          }
                        >
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span className="font-bold">EQUIPO</span>
                            <span className="inline-flex items-center">
                              {equipoSortOrder === 'asc' && (
                                <span className="flex items-center text-sky-700 bg-sky-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-sky-300 shadow-2xs">
                                  <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                  <span className="ml-0.5">1-9</span>
                                </span>
                              )}
                              {equipoSortOrder === 'desc' && (
                                <span className="flex items-center text-purple-700 bg-purple-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-purple-300 shadow-2xs">
                                  <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                                  <span className="ml-0.5">9-1</span>
                                </span>
                              )}
                              {equipoSortOrder === 'none' && (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th className="px-2.5 py-2 text-center min-w-[125px]">DESCRIPCIÓN</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">TIPO</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">CAJA</th>
                        <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">CH</th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Sensor instalado">
                          <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-sky-100 transition-colors" title="Sensor instalado">
                            <Cpu className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Cable tendido">
                          <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-purple-100 transition-colors" title="Cable tendido">
                            <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Conexión en caja de conexiones">
                          <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-amber-100 transition-colors" title="Conexión en caja de conexiones">
                            <Package className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">BIAS</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">NUEVO</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">VIEJO</th>
                        <th className="px-2 py-1.5 text-center min-w-[70px]">
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span>DISCO</span>
                            <span>MONTAJE</span>
                          </div>
                        </th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[80px]">PERFORACION</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[50px] font-black text-xs text-slate-900">%</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[70px]">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {renderPointRows(group.points)}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Content: GROUPED BY JUNCTION BOX */}
        {viewMode === 'grouped_box' && (
          <div className="p-4 sm:p-6 space-y-6">
            {groupedByBox.map((group, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-700 text-white">
                        {group.badge}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{group.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 bg-white border border-slate-300 rounded-full text-slate-700">
                      Total: <strong>{group.points.length}</strong>
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800" title="Completados">
                      <strong>{group.points.filter(isPointDone).length}</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] sm:text-[10.5px] leading-tight select-none">
                      <tr>
                        <th className="p-2 w-9 text-center">Sel</th>
                        <th 
                          className="px-2 py-2 text-center whitespace-nowrap min-w-[85px] cursor-pointer hover:bg-slate-200/90 transition-colors select-none group"
                          onClick={toggleEquipoSort}
                          title={
                            equipoSortOrder === 'asc'
                              ? 'Orden: De menor a mayor (Secadores → Rodillos → Piñones). Clic para ordenar de mayor a menor.'
                              : equipoSortOrder === 'desc'
                                ? 'Orden: De mayor a menor. Clic para orden original.'
                                : 'Clic para organizar de menor a mayor: Secadores → Rodillos → Piñones'
                          }
                        >
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span className="font-bold">EQUIPO</span>
                            <span className="inline-flex items-center">
                              {equipoSortOrder === 'asc' && (
                                <span className="flex items-center text-sky-700 bg-sky-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-sky-300 shadow-2xs">
                                  <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                  <span className="ml-0.5">1-9</span>
                                </span>
                              )}
                              {equipoSortOrder === 'desc' && (
                                <span className="flex items-center text-purple-700 bg-purple-100/90 px-1 py-0.5 rounded text-[9.5px] font-bold border border-purple-300 shadow-2xs">
                                  <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                                  <span className="ml-0.5">9-1</span>
                                </span>
                              )}
                              {equipoSortOrder === 'none' && (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th className="px-2.5 py-2 text-center min-w-[125px]">DESCRIPCIÓN</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">TIPO</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">CAJA</th>
                        <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">CH</th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Sensor instalado">
                          <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-sky-100 transition-colors" title="Sensor instalado">
                            <Cpu className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Cable tendido">
                          <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-purple-100 transition-colors" title="Cable tendido">
                            <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1 py-1 text-center whitespace-nowrap min-w-[36px]" title="Conexión en caja de conexiones">
                          <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs hover:bg-amber-100 transition-colors" title="Conexión en caja de conexiones">
                            <Package className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </th>
                        <th className="px-1.5 py-2 text-center whitespace-nowrap min-w-[50px]">BIAS</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">NUEVO</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[65px]">VIEJO</th>
                        <th className="px-2 py-1.5 text-center min-w-[70px]">
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span>DISCO</span>
                            <span>MONTAJE</span>
                          </div>
                        </th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[80px]">PERFORACION</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[50px] font-black text-xs text-slate-900">%</th>
                        <th className="px-2 py-2 text-center whitespace-nowrap min-w-[70px]">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {renderPointRows(group.points)}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            Mostrando <strong>{filteredPoints.length}</strong> de <strong>{points.length}</strong> componentes en seguimiento
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Nomenclaturas: 1S L3 (Secadores) · 1R L3 (Rodillos) · P (Piñones) · Cajas JB-01, JB-02, JB-03
          </span>
        </div>
      </div>

      {/* Modal de confirmación para eliminar un punto individual */}
      {pointToDelete && (
        <div 
          id="confirm-delete-point-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPointToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar punto de medición?</h3>
                <p className="text-xs text-slate-500">Esta acción removerá el punto del monitoreo y de los cómputos.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nomenclatura (Tag):</span>
                <span className="font-mono font-bold text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">
                  {getNomenclature(pointToDelete)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Componente Mecánico:</span>
                <span className="font-semibold text-slate-800">{getCleanComponentName(pointToDelete)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ubicación / Bornera:</span>
                <span className="font-mono text-slate-700">{pointToDelete.boxId} · CH-{pointToDelete.boxChannel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Tipo:</span>
                <span className="font-medium text-slate-700">{getCleanTypeName(pointToDelete.type)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                id="cancel-delete-point-btn"
                type="button"
                onClick={() => setPointToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-point-action-btn"
                type="button"
                onClick={() => {
                  const id = pointToDelete.id;
                  setPointToDelete(null);
                  if (onDeletePoint) {
                    onDeletePoint(id);
                  } else {
                    onUpdatePoints(points.filter(p => p.id !== id));
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sí, Eliminar Punto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminación masiva */}
      {bulkDeleteConfirmOpen && (
        <div 
          id="confirm-bulk-delete-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setBulkDeleteConfirmOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar {selectedPointIds.length} puntos seleccionados?</h3>
                <p className="text-xs text-slate-500">Se removerán todos los componentes marcados permanentemente.</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Esta acción afectará a {selectedPointIds.length} puntos de medición. Se actualizarán las estadísticas y el cálculo de materiales.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                id="cancel-bulk-delete-btn"
                type="button"
                onClick={() => setBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="confirm-bulk-delete-action-btn"
                type="button"
                onClick={() => {
                  const idsToDelete = [...selectedPointIds];
                  setSelectedPointIds([]);
                  setBulkDeleteConfirmOpen(false);
                  if (onDeletePointsBulk) {
                    onDeletePointsBulk(idsToDelete);
                  } else if (onDeletePoint) {
                    idsToDelete.forEach(id => onDeletePoint(id));
                  } else {
                    onUpdatePoints(points.filter(p => !idsToDelete.includes(p.id)));
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sí, Eliminar {selectedPointIds.length} Puntos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
