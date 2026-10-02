import React, { useState, useEffect, useRef } from 'react';
import { 
  MeasurementPoint, 
  MaterialItem, 
  CostCategory, 
  JunctionBox 
} from './types';
import { 
  INITIAL_POINTS, 
  INITIAL_MATERIALS, 
  INITIAL_COST_CATEGORIES, 
  INITIAL_JUNCTION_BOXES 
} from './data/initialData';

import { Header, ActiveTab } from './components/Header';
import { PointsTable } from './components/PointsTable';
import { MaterialsManager } from './components/MaterialsManager';
import { ProjectProgressDashboard } from './components/ProjectProgressDashboard';
import { JunctionBoxOverview } from './components/JunctionBoxOverview';
import { Schematic2DViewer } from './components/Schematic2DViewer';
import { PointDetailModal } from './components/PointDetailModal';
import { AddPointModal } from './components/AddPointModal';
import { ReportModal } from './components/ReportModal';
import { SmurfitWestrockLogo } from './components/SmurfitWestrockLogo';
import { getPointCoordinates } from './data/schematicCoordinates';
import { 
  saveAllPointsToFirebase,
  saveSinglePointToFirebase,
  deletePointFromFirebase,
  deleteMultiplePointsFromFirebase,
  loadPointsFromFirebase,
  saveAllMaterialsToFirebase,
  loadMaterialsFromFirebase,
  saveAllCostsToFirebase,
  loadCostsFromFirebase,
  saveAllBoxesToFirebase,
  loadBoxesFromFirebase,
  subscribeToPoints
} from './lib/firebase';

const STORAGE_KEY_POINTS = 'vib_monitor_points_v10';
const STORAGE_KEY_MATERIALS = 'vib_monitor_materials_v3';
const STORAGE_KEY_COSTS = 'vib_monitor_costs_v1';
const STORAGE_KEY_BOXES = 'vib_monitor_boxes_v4';

// Bulletproof deduplicator to guarantee 100% unique React keys
export const deduplicatePoints = (rawPoints: MeasurementPoint[]): MeasurementPoint[] => {
  const seenIds = new Set<string>();
  const cleanList: MeasurementPoint[] = [];

  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    if (!p) continue;
    let pointId = p.id;
    if (!pointId || seenIds.has(pointId)) {
      pointId = `${p.id || 'pt'}_${p.area || 1}_${p.boxChannel || i}_${i}`;
    }
    seenIds.add(pointId);
    cleanList.push({
      ...p,
      id: pointId
    });
  }
  return cleanList;
};

// Normalize points to user's latest requested schema:
// - Nomenclature:
//   * Secadores: 1S, 2S, 3S... 48S
//   * Piñones: P-AA, P-A, P-B, P-C, P-I a P-XXIX
//   * Rodillos de lona: 1R, 2R, 3R... según correspondencia numérica
// - Componente Mecánico:
//   * Secadores: Secador #X (instead of Cilindro Secador #X)
//   * Piñones: Piñón Intermedio
//   * Rodillos de Lona: Rodillo de Lona #X (con el número de la nomenclatura)
// - Side: Lado transmisión
// - Junction box: JB #1, JB #2, JB #3
const normalizePoint = (p: MeasurementPoint): MeasurementPoint => {
  let tag = p.tag ? p.tag.trim() : '';

  if (!tag) {
    if (p.type === 'dryer') {
      // Exact consecutive format: 1S, 2S, 3S... 48S
      const match = (p.name || '').match(/#?(\d+)/) || (p.originalLabel ? p.originalLabel.match(/(\d+)/) : null);
      if (match) {
        tag = `${parseInt(match[1], 10)}S`;
      } else {
        tag = '1S';
      }
    } else if (p.type === 'pinion') {
      // Exact consecutive format: P-AA, P-A to P-C, P-I to P-XXIX
      const initialMatch = INITIAL_POINTS.find(ip => ip.id === p.id);
      if (initialMatch && initialMatch.tag && /^P-[A-Z0-9]+$/i.test(initialMatch.tag.trim())) {
        tag = initialMatch.tag.trim().toUpperCase();
      } else {
        const raw = (p.originalLabel || p.name || '').toUpperCase();
        if (raw.includes('AA')) tag = 'P-AA';
        else if (raw.includes('XXVIII')) tag = 'P-XXVIII';
        else if (raw.includes('XXVII')) tag = 'P-XXVII';
        else if (raw.includes('XXVI')) tag = 'P-XXVI';
        else if (raw.includes('XXIX')) tag = 'P-XXIX';
        else if (raw.includes('XXV')) tag = 'P-XXV';
        else if (raw.includes('XXIV')) tag = 'P-XXIV';
        else if (raw.includes('XXIII')) tag = 'P-XXIII';
        else if (raw.includes('XXII')) tag = 'P-XXII';
        else if (raw.includes('XXI')) tag = 'P-XXI';
        else if (raw.includes('XX')) tag = 'P-XX';
        else if (raw.includes('XVIII')) tag = 'P-XVIII';
        else if (raw.includes('XVII')) tag = 'P-XVII';
        else if (raw.includes('XVI')) tag = 'P-XVI';
        else if (raw.includes('XIX')) tag = 'P-XIX';
        else if (raw.includes('XIV')) tag = 'P-XIV';
        else if (raw.includes('XV')) tag = 'P-XV';
        else if (raw.includes('XIII')) tag = 'P-XIII';
        else if (raw.includes('XII')) tag = 'P-XII';
        else if (raw.includes('XI')) tag = 'P-XI';
        else if (raw.includes('X')) tag = 'P-X';
        else if (raw.includes('VIII')) tag = 'P-VIII';
        else if (raw.includes('VII')) tag = 'P-VII';
        else if (raw.includes('VI')) tag = 'P-VI';
        else if (raw.includes('IV')) tag = 'P-IV';
        else if (raw.includes('IX')) tag = 'P-IX';
        else if (raw.includes('V')) tag = 'P-V';
        else if (raw.includes('III')) tag = 'P-III';
        else if (raw.includes('II')) tag = 'P-II';
        else if (/\bI\b/.test(raw) || raw === 'I' || raw.endsWith('-I')) tag = 'P-I';
        else if (/\bA\b/.test(raw) || raw === 'A' || raw.endsWith('-A')) tag = 'P-A';
        else if (/\bB\b/.test(raw) || raw === 'B' || raw.endsWith('-B')) tag = 'P-B';
        else if (/\bC\b/.test(raw) || raw === 'C' || raw.endsWith('-C')) tag = 'P-C';
        else tag = 'P-AA';
      }
    } else if (p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket') {
      const initialMatch = INITIAL_POINTS.find(ip => ip.id === p.id);
      if (initialMatch && initialMatch.tag && /^\d+R$/i.test(initialMatch.tag.trim())) {
        tag = initialMatch.tag.trim().toUpperCase();
      } else {
        const initialFeltPoints = INITIAL_POINTS.filter(ip => ip.type === 'felt_roll_upper' || ip.type === 'felt_roll_pocket');
        const idx = initialFeltPoints.findIndex(ip => ip.id === p.id);
        if (idx !== -1) {
          tag = `${idx + 1}R`;
        } else {
          const numMatch = (p.originalLabel || p.name || '').match(/(\d+)/);
          tag = numMatch ? `${parseInt(numMatch[1], 10)}R` : '1R';
        }
      }
    }
  } else if (p.type === 'dryer') {
    // If dryer tag has legacy L3-XX format, normalize to consecutive 1S, 2S, ..., 48S
    if (!/^\d+[A-Z]?S?$/i.test(tag) || /L\d/i.test(tag)) {
      const initialMatch = INITIAL_POINTS.find(ip => ip.id === p.id);
      if (initialMatch && initialMatch.tag && /^\d+[A-Z]?S?$/i.test(initialMatch.tag.trim()) && !/L\d/i.test(initialMatch.tag)) {
        tag = initialMatch.tag.trim().toUpperCase();
      } else {
        const match = 
          (p.name && p.name.match(/#\s*(\d+[A-Z]?)/i)) ||
          (p.id && p.id.match(/pt-\d+s-(\d+[a-z]?)/i)) ||
          (p.originalLabel && p.originalLabel.match(/^(\d+[A-Z]?)/i)) ||
          tag.match(/L3-(\d+)/i);
        if (match) {
          const rawNum = match[1].toUpperCase().replace(/^0+/, '');
          tag = rawNum.endsWith('S') || rawNum.endsWith('A') ? rawNum : `${rawNum}S`;
        } else {
          tag = '1S';
        }
      }
    }
  } else if (p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket') {
    // If tag is not purely number + R (e.g. legacy '1R L3-01B'), normalize it
    if (!/^\d+R$/i.test(tag)) {
      const initialMatch = INITIAL_POINTS.find(ip => ip.id === p.id);
      if (initialMatch && initialMatch.tag && /^\d+R$/i.test(initialMatch.tag.trim())) {
        tag = initialMatch.tag.trim().toUpperCase();
      } else {
        const initialFeltPoints = INITIAL_POINTS.filter(ip => ip.type === 'felt_roll_upper' || ip.type === 'felt_roll_pocket');
        const idx = initialFeltPoints.findIndex(ip => ip.id === p.id);
        if (idx !== -1) {
          tag = `${idx + 1}R`;
        } else {
          const numMatch = tag.match(/(\d+)/) || (p.originalLabel || p.name || '').match(/(\d+)/);
          tag = numMatch ? `${parseInt(numMatch[1], 10)}R` : '1R';
        }
      }
    }
  }

  let name = p.name ? p.name.trim() : '';
  if (p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket') {
    const numMatch = tag.match(/(\d+)/) 
      || (p.tag || '').match(/(\d+)/) 
      || (name || '').match(/#?(\d+)/) 
      || (p.originalLabel || '').match(/(\d+)/);
    if (numMatch) {
      name = `Rodillo de Lona #${parseInt(numMatch[1], 10)}`;
    } else {
      name = 'Rodillo de Lona';
    }
  } else if (!name) {
    if (p.type === 'pinion') {
      name = 'Piñón Intermedio';
    } else {
      name = 'Secador';
    }
  } else if (name.toLowerCase().startsWith('cilindro secador')) {
    name = name.replace(/^cilindro\s+secador/i, 'Secador');
  }

  let boxId = p.boxId;
  const rawBox = String(boxId || '').trim();
  if (rawBox === 'JB-01' || rawBox === 'JB Area 1' || rawBox === 'JB #1' || rawBox.includes('1') || rawBox.toLowerCase().includes('área 1') || rawBox.toLowerCase().includes('area 1')) boxId = 'JB #1';
  else if (rawBox === 'JB-02' || rawBox === 'JB Area 2' || rawBox === 'JB #2' || rawBox.includes('2') || rawBox.toLowerCase().includes('área 2') || rawBox.toLowerCase().includes('area 2')) boxId = 'JB #2';
  else if (rawBox === 'JB-03' || rawBox === 'JB Area 3' || rawBox === 'JB #3' || rawBox.includes('3') || rawBox.toLowerCase().includes('área 3') || rawBox.toLowerCase().includes('area 3')) boxId = 'JB #3';
  else boxId = 'JB #1';

  const coordinates = (p.coordinates && typeof p.coordinates.x === 'number') 
    ? p.coordinates 
    : getPointCoordinates(p);

  return {
    ...p,
    name,
    tag,
    boxId,
    side: p.side || 'Lado transmisión',
    coordinates
  };
};

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('points');

  // Core Data with localStorage persistence
  const [points, setPoints] = useState<MeasurementPoint[]>(() => {
    try {
      const savedV10 = localStorage.getItem(STORAGE_KEY_POINTS);
      if (savedV10) {
        const parsed: MeasurementPoint[] = JSON.parse(savedV10);
        return deduplicatePoints(parsed.map(normalizePoint));
      }

      const savedOld = localStorage.getItem('vib_monitor_points_v9') || localStorage.getItem('vib_monitor_points_v8') || localStorage.getItem('vib_monitor_points_v7') || localStorage.getItem('vib_monitor_points_v6');
      if (savedOld) {
        const parsed: MeasurementPoint[] = JSON.parse(savedOld);
        const savedById = new Map(parsed.map(p => [p.id, p]));
        const savedByAreaTag = new Map(parsed.map(p => [`${p.area}_${p.tag}`, p]));

        const merged = INITIAL_POINTS.map(initPt => {
          const savedPt = savedById.get(initPt.id) || savedByAreaTag.get(`${initPt.area}_${initPt.tag}`);
          if (savedPt) {
            return {
              ...initPt,
              ...savedPt,
              id: initPt.id, // Strictly preserve unique id
              tag: initPt.tag, // Strictly preserve clean new tag (1S, 2S, ..., 16S)
              name: initPt.name,
              area: initPt.area,
              boxId: initPt.boxId,
              stages: savedPt.stages || initPt.stages,
              status: savedPt.status || initPt.status,
              condition: savedPt.condition !== undefined ? savedPt.condition : initPt.condition,
              biasVoltage: savedPt.biasVoltage !== undefined ? savedPt.biasVoltage : initPt.biasVoltage
            };
          }
          return initPt;
        });

        const initIds = new Set(INITIAL_POINTS.map(p => p.id));
        const initAreaTags = new Set(INITIAL_POINTS.map(p => `${p.area}_${p.tag}`));
        const extraSaved = parsed.filter(p => !initIds.has(p.id) && !initAreaTags.has(`${p.area}_${p.tag}`));
        const finalNormalized = deduplicatePoints([...merged, ...extraSaved].map(normalizePoint));
        try {
          localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(finalNormalized));
        } catch {
          // ignore
        }
        return finalNormalized;
      }
    } catch (e) {
      console.error('Error loading points from localStorage:', e);
    }
    return deduplicatePoints(INITIAL_POINTS.map(normalizePoint));
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATERIALS);
      if (saved) {
        const parsed: MaterialItem[] = JSON.parse(saved);
        return parsed.map(m => {
          if (!m.imageUrl) {
            const initMatch = INITIAL_MATERIALS.find(im => im.id === m.id || im.code === m.code);
            if (initMatch?.imageUrl) {
              return { ...m, imageUrl: initMatch.imageUrl };
            }
          }
          return m;
        });
      }
      const savedOld = localStorage.getItem('vib_monitor_materials_v2');
      if (savedOld) {
        const parsed: MaterialItem[] = JSON.parse(savedOld);
        if (parsed.some(m => m.code === '3613840' || m.unitCost > 10000)) {
          return parsed.map(m => {
            if (!m.imageUrl) {
              const initMatch = INITIAL_MATERIALS.find(im => im.id === m.id || im.code === m.code);
              if (initMatch?.imageUrl) {
                return { ...m, imageUrl: initMatch.imageUrl };
              }
            }
            return m;
          });
        }
      }
    } catch (e) {
      console.error('Error loading materials from localStorage:', e);
    }
    return INITIAL_MATERIALS;
  });

  const [categories, setCategories] = useState<CostCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COSTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading costs from localStorage:', e);
    }
    return INITIAL_COST_CATEGORIES;
  });

  const [junctionBoxes, setJunctionBoxes] = useState<JunctionBox[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOXES);
      if (saved) {
        const parsed: JunctionBox[] = JSON.parse(saved);
        return parsed.map(jb => {
          let id = jb.id;
          if (id.toLowerCase().includes('sotano') || id.toLowerCase().includes('sótano')) id = 'Área Sótano';
          else if (id === 'JB Area 1' || id === 'JB-01' || id === 'JB #1' || id.includes('1')) id = 'JB #1';
          else if (id === 'JB Area 2' || id === 'JB-02' || id === 'JB #2' || id.includes('2')) id = 'JB #2';
          else if (id === 'JB Area 3' || id === 'JB-03' || id === 'JB #3' || id.includes('3')) id = 'JB #3';
          else id = 'JB #1';

          let name = jb.name.replace(/JB\s*Area\s*/i, 'JB #');
          if (id === 'JB #2') {
            return {
              ...jb,
              id: 'JB #2',
              name,
              usedChannels: 43,
              status: 'in_progress',
              location: 'Secadores 17 al 23 y accionamientos - Lado transmisión',
              notes: 'Conectados a JB #2: 7 secadores (17S a 23S), 6 piñones (P-IV a P-IX) y 30 rodillos de lona (18R al 22R, 26R al 33R, 43R al 49R, 63R al 67R y 73R al 77R).'
            };
          }
          if (id === 'JB #3') {
            return {
              ...jb,
              id: 'JB #3',
              name,
              totalChannels: 72,
              usedChannels: 67,
              status: 'in_progress',
              location: 'Secadores 23A al 38 y accionamientos - Lado transmisión',
              notes: 'Conectados a JB #3: 16 secadores (23A al 38S), 20 piñones (P-X al P-XXIX) y 31 rodillos de lona (50R al 64R y 68R al 83R).'
            };
          }
          return { ...jb, id: 'JB #1', name };
        });
      }
    } catch (e) {
      console.error('Error loading boxes from localStorage:', e);
    }
    return INITIAL_JUNCTION_BOXES;
  });

  // Modals state
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');
  const isInitialSyncDone = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize and synchronize with Firebase Firestore (enables access from any computer)
  useEffect(() => {
    let unsubscribePoints: (() => void) | null = null;
    let isMounted = true;

    const initFirebaseData = async () => {
      setSyncStatus('syncing');
      try {
        const [fbPoints, fbMaterials, fbCosts, fbBoxes] = await Promise.all([
          loadPointsFromFirebase(),
          loadMaterialsFromFirebase(),
          loadCostsFromFirebase(),
          loadBoxesFromFirebase()
        ]);

        if (isMounted) {
          if (fbPoints && fbPoints.length > 0) {
            console.log(`Cargados ${fbPoints.length} puntos desde Firebase Firestore`);
            const fbById = new Map(fbPoints.map(p => [p.id, p]));
            const fbByAreaTag = new Map(fbPoints.map(p => [`${p.area}_${p.tag}`, p]));

            const merged = INITIAL_POINTS.map(initPt => {
              const cloudPt = fbById.get(initPt.id) || fbByAreaTag.get(`${initPt.area}_${initPt.tag}`);
              if (cloudPt) {
                return {
                  ...initPt,
                  ...cloudPt,
                  id: initPt.id,
                  tag: initPt.tag,
                  area: cloudPt.area !== undefined ? cloudPt.area : initPt.area,
                  boxId: cloudPt.boxId !== undefined ? cloudPt.boxId : initPt.boxId,
                  stages: cloudPt.stages || initPt.stages,
                  status: cloudPt.status || initPt.status,
                  condition: cloudPt.condition !== undefined ? cloudPt.condition : initPt.condition,
                  biasVoltage: cloudPt.biasVoltage !== undefined ? cloudPt.biasVoltage : initPt.biasVoltage
                };
              }
              return initPt;
            });
            const initIds = new Set(INITIAL_POINTS.map(p => p.id));
            const initAreaTags = new Set(INITIAL_POINTS.map(p => `${p.area}_${p.tag}`));
            const extraFb = fbPoints.filter(p => !initIds.has(p.id) && !initAreaTags.has(`${p.area}_${p.tag}`));
            const finalPoints = deduplicatePoints([...merged, ...extraFb].map(normalizePoint));
            setPoints(finalPoints);
            saveAllPointsToFirebase(finalPoints).catch(console.error);
          } else {
            // Si la base de datos en Firebase está vacía, subimos la versión local inicial
            console.log('Subiendo datos iniciales a Firebase...');
            await saveAllPointsToFirebase(points);
          }

          if (fbMaterials && fbMaterials.length > 0) {
            setMaterials(fbMaterials);
          } else {
            await saveAllMaterialsToFirebase(materials);
          }

          if (fbCosts && fbCosts.length > 0) {
            setCategories(fbCosts);
          } else {
            await saveAllCostsToFirebase(categories);
          }

          if (fbBoxes && fbBoxes.length > 0) {
            setJunctionBoxes(fbBoxes);
          } else {
            await saveAllBoxesToFirebase(junctionBoxes);
          }

          setSyncStatus('synced');
          isInitialSyncDone.current = true;

          // Suscripción en tiempo real para reflejar cambios automáticos entre computadores
          unsubscribePoints = subscribeToPoints((cloudPoints) => {
            if (isMounted && cloudPoints && cloudPoints.length > 0) {
              const fbById = new Map(cloudPoints.map(p => [p.id, p]));
              const fbByAreaTag = new Map(cloudPoints.map(p => [`${p.area}_${p.tag}`, p]));
              setPoints(prev => {
                const updated = prev.map(p => {
                  const cloudPt = fbById.get(p.id) || fbByAreaTag.get(`${p.area}_${p.tag}`);
                  if (cloudPt) {
                    return normalizePoint({
                      ...p,
                      ...cloudPt,
                      id: p.id,
                      stages: cloudPt.stages || p.stages,
                      status: cloudPt.status || p.status,
                      condition: cloudPt.condition !== undefined ? cloudPt.condition : p.condition,
                      biasVoltage: cloudPt.biasVoltage !== undefined ? cloudPt.biasVoltage : p.biasVoltage
                    });
                  }
                  return p;
                });
                return deduplicatePoints(updated);
              });
            }
          });
        }
      } catch (err) {
        console.error('Error al sincronizar con Firebase:', err);
        if (isMounted) {
          setSyncStatus('error');
        }
      }
    };

    initFirebaseData();

    return () => {
      isMounted = false;
      if (unsubscribePoints) {
        unsubscribePoints();
      }
    };
  }, []);

  const handleForceSync = async () => {
    setSyncStatus('syncing');
    showToast('Sincronizando todos los datos con Firebase en la nube...');
    try {
      await Promise.all([
        saveAllPointsToFirebase(points),
        saveAllMaterialsToFirebase(materials),
        saveAllCostsToFirebase(categories),
        saveAllBoxesToFirebase(junctionBoxes)
      ]);
      setSyncStatus('synced');
      showToast('¡Datos sincronizados exitosamente en Firebase para cualquier computador!');
    } catch (err) {
      console.error('Error al forzar sincronización Firebase:', err);
      setSyncStatus('error');
      showToast('Error al sincronizar con Firebase');
    }
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(points));
    } catch (e) {
      console.error('Failed to save points:', e);
    }
  }, [points]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MATERIALS, JSON.stringify(materials));
    } catch (e) {
      console.error('Failed to save materials:', e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save costs:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOXES, JSON.stringify(junctionBoxes));
    } catch (e) {
      console.error('Failed to save boxes:', e);
    }
  }, [junctionBoxes]);

  // Point Selection & Saving
  const handleSelectPoint = (point: MeasurementPoint) => {
    setSelectedPoint(point);
    setIsDetailModalOpen(true);
  };

  const handleSavePoint = (updatedPoint: MeasurementPoint) => {
    const normalized = normalizePoint(updatedPoint);
    setPoints(prev => prev.map(p => p.id === normalized.id ? normalized : p));
    setSelectedPoint(normalized);
    showToast(`Punto ${normalized.tag} actualizado correctamente`);

    // Sincronizar en Firebase
    saveSinglePointToFirebase(normalized).catch(err => {
      console.error('Error guardando punto en Firebase:', err);
    });

    // Auto-update materials consumption
    setTimeout(() => {
      syncMaterialsWithPoints(points.map(p => p.id === normalized.id ? normalized : p));
    }, 100);
  };

  const handleUpdatePoints = (updatedPoints: MeasurementPoint[]) => {
    const normalized = deduplicatePoints(updatedPoints.map(normalizePoint));
    setPoints(normalized);
    showToast(`${normalized.length} puntos sincronizados`);
    syncMaterialsWithPoints(normalized);

    saveAllPointsToFirebase(normalized).catch(err => {
      console.error('Error actualizando puntos en Firebase:', err);
    });
  };

  const handleAddNewPoint = (newPoint: MeasurementPoint) => {
    const normalized = normalizePoint(newPoint);
    setPoints(prev => deduplicatePoints([...prev, normalized]));
    showToast(`Punto ${normalized.tag} agregado con éxito`);

    saveSinglePointToFirebase(normalized).catch(err => {
      console.error('Error agregando nuevo punto en Firebase:', err);
    });
  };

  const handleDeletePoint = (pointId: string) => {
    const target = points.find(p => p.id === pointId);
    const nom = target ? target.tag : '';
    setPoints(prev => {
      const updated = prev.filter(p => p.id !== pointId);
      syncMaterialsWithPoints(updated);
      return updated;
    });
    if (selectedPoint && selectedPoint.id === pointId) {
      setIsDetailModalOpen(false);
      setSelectedPoint(null);
    }
    showToast(nom ? `Punto ${nom} eliminado exitosamente` : 'Punto eliminado exitosamente');

    deletePointFromFirebase(pointId).catch(err => {
      console.error('Error eliminando punto en Firebase:', err);
    });
  };

  const handleDeletePointsBulk = (pointIds: string[]) => {
    setPoints(prev => {
      const updated = prev.filter(p => !pointIds.includes(p.id));
      syncMaterialsWithPoints(updated);
      return updated;
    });
    if (selectedPoint && pointIds.includes(selectedPoint.id)) {
      setIsDetailModalOpen(false);
      setSelectedPoint(null);
    }
    showToast(`${pointIds.length} puntos eliminados exitosamente`);

    deleteMultiplePointsFromFirebase(pointIds).catch(err => {
      console.error('Error eliminando puntos en lote en Firebase:', err);
    });
  };

  // Synchronize materials based on installed points
  const syncMaterialsWithPoints = (currentPoints: MeasurementPoint[]) => {
    const installed = currentPoints.filter(p => p.status === 'installed' || p.status === 'verified');
    const installedCount = installed.length;
    const cableCount = installed.reduce((acc, p) => acc + (p.cableMeters || 0), 0);
    const conduitCount = Math.round(cableCount * 0.45);

    setMaterials(prev => prev.map(mat => {
      if (mat.category === 'sensors' && mat.code.includes('102')) {
        return { ...mat, installedQty: installedCount };
      }
      if (mat.category === 'cables') {
        return { ...mat, installedQty: cableCount };
      }
      if (mat.category === 'conduit') {
        return { ...mat, installedQty: conduitCount };
      }
      if (mat.code.includes('STUD')) {
        return { ...mat, installedQty: installedCount };
      }
      return mat;
    }));
  };

  // Export Backup JSON
  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      points,
      materials,
      categories,
      junctionBoxes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vibration_Monitoring_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de respaldo descargada en formato JSON');
  };

  // Import Backup JSON
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.points && Array.isArray(data.points)) {
          const norm = data.points.map(normalizePoint);
          setPoints(norm);
          if (data.materials) setMaterials(data.materials);
          if (data.categories) setCategories(data.categories);
          if (data.junctionBoxes) setJunctionBoxes(data.junctionBoxes);
          showToast('Copia de respaldo restaurada exitosamente. Sincronizando con Firebase...');

          try {
            await Promise.all([
              saveAllPointsToFirebase(norm),
              data.materials ? saveAllMaterialsToFirebase(data.materials) : Promise.resolve(),
              data.categories ? saveAllCostsToFirebase(data.categories) : Promise.resolve(),
              data.junctionBoxes ? saveAllBoxesToFirebase(data.junctionBoxes) : Promise.resolve()
            ]);
            setSyncStatus('synced');
            showToast('Copia de respaldo sincronizada en Firebase');
          } catch (fbErr) {
            console.error('Error subiendo respaldo a Firebase:', fbErr);
          }
        } else {
          alert('El archivo JSON no tiene el formato esperado del proyecto.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Reset to initial factory data
  const handleResetData = () => {
    if (confirm('¿Desea restaurar todos los datos a la configuración inicial del proyecto? Se perderán las modificaciones locales no respaldadas.')) {
      setPoints(INITIAL_POINTS);
      setMaterials(INITIAL_MATERIALS);
      setCategories(INITIAL_COST_CATEGORIES);
      setJunctionBoxes(INITIAL_JUNCTION_BOXES);
      localStorage.removeItem(STORAGE_KEY_POINTS);
      localStorage.removeItem(STORAGE_KEY_MATERIALS);
      localStorage.removeItem(STORAGE_KEY_COSTS);
      localStorage.removeItem(STORAGE_KEY_BOXES);
      showToast('Datos reiniciados a los valores iniciales');
    }
  };

  return (
    <div id="vibration-monitoring-app" className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        points={points}
        onOpenReport={() => setIsReportModalOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetData={handleResetData}
        syncStatus={syncStatus}
        onForceSync={handleForceSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* VIEW 1: POINTS & COMPONENTS LIST */}
        {activeTab === 'points' && (
          <PointsTable
            points={points}
            onSelectPoint={handleSelectPoint}
            onUpdatePoints={handleUpdatePoints}
            onAddNewPoint={() => setIsAddPointModalOpen(true)}
            onDeletePoint={handleDeletePoint}
            onDeletePointsBulk={handleDeletePointsBulk}
          />
        )}

        {/* VIEW 3: MATERIALS INVENTORY */}
        {activeTab === 'materials' && (
          <MaterialsManager
            materials={materials}
            points={points}
            onUpdateMaterials={setMaterials}
          />
        )}

        {/* VIEW 4: PROJECT PROGRESS DASHBOARD */}
        {(activeTab === 'progress' || activeTab === 'costs') && (
          <ProjectProgressDashboard
            points={points}
            materials={materials}
            junctionBoxes={junctionBoxes}
            onSelectPoint={handleSelectPoint}
          />
        )}

        {/* VIEW 5: VISOR 2D ÁREA 1 */}
        {activeTab === 'boxes' && (
          <Schematic2DViewer
            area={1}
            boxes={junctionBoxes}
            points={points}
            onSelectPoint={handleSelectPoint}
            onSavePoint={handleSavePoint}
          />
        )}

        {/* VIEW 6: VISOR 2D ÁREA 2 */}
        {activeTab === 'area2' && (
          <Schematic2DViewer
            area={2}
            boxes={junctionBoxes}
            points={points}
            onSelectPoint={handleSelectPoint}
            onSavePoint={handleSavePoint}
          />
        )}

        {/* VIEW 7: VISOR 2D ÁREA 3 */}
        {activeTab === 'area3' && (
          <Schematic2DViewer
            area={3}
            boxes={junctionBoxes}
            points={points}
            onSelectPoint={handleSelectPoint}
            onSavePoint={handleSavePoint}
          />
        )}
      </main>

      {/* Point Detail / Diligence Modal */}
      {isDetailModalOpen && selectedPoint && (
        <PointDetailModal
          isOpen={isDetailModalOpen}
          point={selectedPoint}
          allPoints={points}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleSavePoint}
          onSelectPoint={(p) => setSelectedPoint(p)}
          onDelete={handleDeletePoint}
        />
      )}

      {/* Add New Point Modal */}
      {isAddPointModalOpen && (
        <AddPointModal
          isOpen={isAddPointModalOpen}
          onClose={() => setIsAddPointModalOpen(false)}
          onAddPoint={handleAddNewPoint}
          existingPoints={points}
        />
      )}

      {/* Executive Printable Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          points={points}
          materials={materials}
          categories={categories}
          junctionBoxes={junctionBoxes}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SmurfitWestrockLogo theme="light" size="sm" />
            <div className="border-l border-slate-200 pl-3 text-left">
              <p className="font-semibold text-slate-700">Smurfit Westrock · Packaging Solutions</p>
              <p className="text-[11px] text-slate-400">Sistema de Medición Remota de Vibraciones Mecánicas · Sección de Secado</p>
            </div>
          </div>
          <div className="text-center sm:text-right font-mono text-[11px] text-slate-400">
            <p>Planta Papelera · Mantenimiento Predictivo & Confiabilidad</p>
            <p>82 Puntos de Medición · Cajas JB-01, JB-02 y JB-03</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
