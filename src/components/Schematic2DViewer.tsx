import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MeasurementPoint, JunctionBox, PointStatus } from '../types';
import { getCleanComponentName, formatBoxId, getNomenclature, getEquipoSortWeight } from './PointsTable';
import { 
  Image as ImageIcon,
  Check,
  Search,
  X,
  ArrowRight,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface Schematic2DViewerProps {
  area?: 1 | 2 | 3;
  boxes?: JunctionBox[];
  points?: MeasurementPoint[];
  onSelectPoint?: (point: MeasurementPoint) => void;
  onSavePoint?: (updatedPoint: MeasurementPoint) => void;
}

export const Schematic2DViewer: React.FC<Schematic2DViewerProps> = ({
  area = 1,
  boxes = [],
  points = [],
  onSelectPoint,
  onSavePoint
}) => {
  const currentArea = area;
  const storageKey = currentArea === 3
    ? 'vib_monitor_schematic_area3_original'
    : currentArea === 2 
      ? 'vib_monitor_schematic_area2_original' 
      : 'vib_monitor_schematic_area1_original';

  const defaultFileName = currentArea === 3 ? 'AREA 3.jfif' : currentArea === 2 ? 'AREA 2.jfif' : 'AREA 1.jfif';

  // Loaded blueprint image (kept from persistent localStorage for this specific area)
  const [imageSrc, setImageSrc] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync image when area switches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setImageSrc(stored);
    } catch {
      setImageSrc(null);
    }
  }, [storageKey]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'amber' | 'red'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dryer' | 'pinion' | 'roller'>('all');

  // Selected point for detailed stage management drawer
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Points of the current area, sorted exactly as in the Listado General table
  const areaPoints = useMemo(() => {
    const list = points.filter(p => {
      // Exclude points assigned to Área Sótano
      if (
        p.area === 4 ||
        String(p.area).toLowerCase().includes('sotano') ||
        String(p.area).toLowerCase().includes('sótano') ||
        formatBoxId(p.boxId) === 'Área Sótano' ||
        String(p.boxId).toLowerCase().includes('sotano') ||
        String(p.boxId).toLowerCase().includes('sótano')
      ) {
        return false;
      }

      // Check explicit area first
      if (p.area !== undefined && p.area !== null && p.area !== '') {
        return Number(p.area) === currentArea;
      }

      // Fallback to boxId
      const cleanBox = formatBoxId(p.boxId);
      if (currentArea === 3) return cleanBox === 'JB #3';
      if (currentArea === 2) return cleanBox === 'JB #2';
      return cleanBox === 'JB #1';
    });
    return [...list].sort((a, b) => getEquipoSortWeight(a) - getEquipoSortWeight(b));
  }, [points, currentArea]);

  // Counts by type for the current area
  const dryerCount = useMemo(() => areaPoints.filter(p => p.type === 'dryer').length, [areaPoints]);
  const pinionCount = useMemo(() => areaPoints.filter(p => p.type === 'pinion').length, [areaPoints]);
  const rollerCount = useMemo(() => areaPoints.filter(p => p.type.includes('felt')).length, [areaPoints]);

  // Helper: check completion percentage (0 - 100) exactly matching Listado General milestones
  const getPointProgress = (p: MeasurementPoint): number => {
    const count = (p.stages?.sensorMounted ? 1 : 0) +
                  (p.stages?.cablePulled ? 1 : 0) +
                  (p.stages?.connectedToJB ? 1 : 0);
    if (count === 3 || p.status === 'verified') return 100;
    if (count === 2) return 67;
    if (count === 1) return 33;
    if (p.status === 'installed') return 67;
    if (p.status === 'in_progress') return 33;
    return 0;
  };

  const is100Percent = (p: MeasurementPoint): boolean => {
    const count = (p.stages?.sensorMounted ? 1 : 0) +
                  (p.stages?.cablePulled ? 1 : 0) +
                  (p.stages?.connectedToJB ? 1 : 0);
    return count === 3 || p.status === 'verified';
  };

  // Filtered single list of points
  const displayedPoints = useMemo(() => {
    return areaPoints.filter(p => {
      const isDone = is100Percent(p);
      const progress = getPointProgress(p);

      if (statusFilter === 'green' && !isDone) return false;
      if (statusFilter === 'amber' && (progress === 0 || progress === 100)) return false;
      if (statusFilter === 'red' && progress > 0) return false;

      const isDryer = p.type === 'dryer';
      const isPinion = p.type === 'pinion';
      const isRoller = p.type === 'felt_roll_pocket' || p.type === 'felt_roll_upper';

      if (typeFilter === 'dryer' && !isDryer) return false;
      if (typeFilter === 'pinion' && !isPinion) return false;
      if (typeFilter === 'roller' && !isRoller) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tag = (p.tag || '').toLowerCase();
        const nom = getNomenclature(p).toLowerCase();
        const name = (p.name || '').toLowerCase();
        const orig = (p.originalLabel || '').toLowerCase();
        return tag.includes(q) || nom.includes(q) || name.includes(q) || orig.includes(q);
      }

      return true;
    });
  }, [areaPoints, statusFilter, typeFilter, searchQuery]);

  // Overall Statistics for this area
  const stats = useMemo(() => {
    const total = areaPoints.length;
    const completed = areaPoints.filter(is100Percent).length;
    const inProgress = areaPoints.filter(p => {
      const prog = getPointProgress(p);
      return prog > 0 && prog < 100;
    }).length;
    const pending = total - completed - inProgress;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, percent };
  }, [areaPoints]);

  // Selected point details
  const selectedPoint = useMemo(() => {
    return points.find(p => p.id === selectedPointId) || null;
  }, [points, selectedPointId]);

  // 1-Click Toggle: flip point between 100% (Verde) and 0% (Rojo)
  const handleToggle100 = (pt: MeasurementPoint) => {
    if (!onSavePoint) return;
    const isDone = is100Percent(pt);

    const newStages = {
      ...pt.stages,
      baseMachined: !isDone,
      sensorMounted: !isDone,
      conduitInstalled: !isDone,
      cablePulled: !isDone,
      connectedToJB: !isDone,
      biasVerified: !isDone ? (pt.stages?.biasVerified ?? true) : false,
      vibrationTestOk: !isDone ? (pt.stages?.vibrationTestOk ?? true) : false
    };

    const updatedPoint: MeasurementPoint = {
      ...pt,
      stages: newStages,
      biasVoltage: !isDone ? (pt.biasVoltage || 12.0) : 0,
      status: !isDone ? 'verified' : 'pending'
    };

    onSavePoint(updatedPoint);
  };

  // Toggle individual stage
  const handleToggleStage = (pt: MeasurementPoint, stageKey: keyof MeasurementPoint['stages']) => {
    if (!onSavePoint) return;
    const currentVal = Boolean(pt.stages?.[stageKey]);
    const updatedStages = {
      ...pt.stages,
      [stageKey]: !currentVal
    };

    const count = (updatedStages.sensorMounted ? 1 : 0) +
                  (updatedStages.cablePulled ? 1 : 0) +
                  (updatedStages.connectedToJB ? 1 : 0);

    let newStatus: PointStatus = 'pending';
    if (count === 3) newStatus = 'verified';
    else if (count === 2) newStatus = 'installed';
    else if (count === 1) newStatus = 'in_progress';

    const updatedPoint: MeasurementPoint = {
      ...pt,
      stages: updatedStages,
      status: newStatus
    };

    onSavePoint(updatedPoint);
  };

  // Clear loaded schematic
  const handleClearImage = () => {
    setImageSrc(null);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Error clearing schematic:', e);
    }
  };

  // Process file upload / paste
  const processFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') ||
      lowerName.endsWith('.jfif') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp') ||
      lowerName.endsWith('.svg');
    if (!isImage) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImageSrc(dataUrl);
        try {
          localStorage.setItem(storageKey, dataUrl);
        } catch (err) {
          console.warn('Storage quota:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [storageKey]);

  return (
    <div className="w-full space-y-5">
      {/* Hidden file input for uploading or replacing the schematic */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.jfif,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processFile(file);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* ================= BARRA SUPERIOR CON BOTÓN PARA ADJUNTAR / REEMPLAZAR ESQUEMA ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Esquema Técnico 2D · Área {currentArea}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentArea === 3
                  ? 'Secadores 23A al 38 (JB #3)'
                  : currentArea === 2
                    ? 'Tercera Sección · Clupak · Segunda Sección (JB #2)'
                    : 'Secadores 1 al 16 (JB #1)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {imageSrc
                ? 'Plano cargado. Puedes adjuntar nuevamente un nuevo esquema para reemplazarlo en cualquier momento.'
                : `No hay esquema cargado para Área ${currentArea}. Haz clic en el botón o arrastra el archivo ${defaultFileName}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Adjuntar o reemplazar esquema de esta área"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{imageSrc ? 'Adjuntar nuevamente / Reemplazar' : `Adjuntar Esquema (${defaultFileName})`}</span>
          </button>

          {imageSrc && (
            <button
              type="button"
              onClick={handleClearImage}
              className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-300 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Quitar plano actual para volver a cargarlo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Quitar</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 1. ESQUEMA TÉCNICO (VISTA COMPLETA, SIN MOVER NI EDITAR) ================= */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
        className={`bg-white border rounded-2xl shadow-sm overflow-hidden p-3 sm:p-5 flex items-center justify-center min-h-[340px] sm:min-h-[420px] transition-all relative ${
          isDragging ? 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/20' : 'border-slate-200'
        }`}
      >
        {imageSrc ? (
          <div className="w-full flex flex-col items-center justify-center py-1 overflow-hidden relative group">
            <div className="w-full flex items-center justify-center pointer-events-none select-none">
              <img
                src={imageSrc}
                alt={`Esquema Área ${currentArea}`}
                className="max-w-full max-h-[440px] w-auto h-auto object-contain bg-white pointer-events-none select-none mx-auto block"
                style={{
                  transform: currentArea === 2 || currentArea === 3 ? 'scale(0.92)' : 'scale(0.80)',
                  transformOrigin: 'center center'
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Botón flotante accesible al pasar el cursor */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-1 shadow-md flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="Adjuntar nuevamente o reemplazar por un archivo nuevo"
              >
                <Upload className="w-3 h-3" />
                <span>Reemplazar</span>
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                title="Quitar plano actual"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="text-center p-8 max-w-md cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 group-hover:text-slate-800 group-hover:border-slate-400 mx-auto flex items-center justify-center shadow-xs transition-all mb-3">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold text-base">
              Colocar Esquema Original ({defaultFileName})
            </h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Haz clic aquí, arrastra el archivo o presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Ctrl+V</kbd> para visualizar el plano completo del Área {currentArea}.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar {defaultFileName}</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= 2. FILTERS & SEARCH BAR ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('green')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'green' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>100% Verde ({stats.completed})</span>
              </button>
              <button
                onClick={() => setStatusFilter('amber')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'amber' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>En Proceso ({stats.inProgress})</span>
              </button>
              <button
                onClick={() => setStatusFilter('red')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'red' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Pendiente Rojo ({stats.pending})</span>
              </button>
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                  typeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos los Tipos
              </button>
              <button
                onClick={() => setTypeFilter('dryer')}
                className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                  typeFilter === 'dryer' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Secadores ({dryerCount})
              </button>
              <button
                onClick={() => setTypeFilter('pinion')}
                className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                  typeFilter === 'pinion' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Piñones ({pinionCount})
              </button>
              <button
                onClick={() => setTypeFilter('roller')}
                className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                  typeFilter === 'roller' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rodillos ({rollerCount})
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por equipo o tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. LISTADO GENERAL CON IDENTIFICACIÓN EXACTA DE COLUMNA EQUIPO ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-black text-slate-900">
              Listado General de Puntos Área {currentArea} (Identificación Columna EQUIPO)
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {displayedPoints.length} de {areaPoints.length}
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Avance Global Área {currentArea}: <span className="font-mono font-bold text-emerald-600">{stats.completed} de {stats.total} ({stats.percent}%)</span>
          </div>
        </div>

        {/* Grid of Simplified Cards */}
        {displayedPoints.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se encontraron componentes con los filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
            {displayedPoints.map((pt, idx) => {
              const isDone = is100Percent(pt);
              const progress = getPointProgress(pt);
              const isSelected = selectedPointId === pt.id;

              // Exact identification from Listado General column "EQUIPO"
              const equipoLabel = getNomenclature(pt);

              // Colors based on real-time progress
              let cardBg = 'bg-rose-50/60 border-rose-200 hover:bg-rose-50 hover:border-rose-300';
              let circleBg = 'bg-rose-500 text-white border-rose-600';
              let badgeColor = 'bg-white text-rose-700 border-rose-200';

              if (isDone) {
                cardBg = 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300';
                circleBg = 'bg-emerald-600 text-white border-emerald-700';
                badgeColor = 'bg-emerald-600 text-white border-emerald-700';
              } else if (progress > 0) {
                cardBg = 'bg-amber-50/70 border-amber-200 hover:bg-amber-50 hover:border-amber-300';
                circleBg = 'bg-amber-500 text-white border-amber-600';
                badgeColor = 'bg-white text-amber-700 border-amber-200';
              }

              return (
                <div
                  key={pt.id ? `${pt.id}_${pt.area || ''}_${idx}` : `pt-card-${idx}`}
                  onClick={() => setSelectedPointId(pt.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-xs ${cardBg} ${
                    isSelected ? 'ring-2 ring-sky-500 shadow-md scale-[1.02] z-10' : ''
                  }`}
                  title={`${equipoLabel} · ${getCleanComponentName(pt)} · Click para ver/ajustar hitos`}
                >
                  {/* Círculo de color con la identificación exacta de la columna EQUIPO */}
                  <div
                    className={`min-w-10 h-10 px-2 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 border shadow-xs transition-colors ${circleBg}`}
                  >
                    {equipoLabel}
                  </div>

                  {/* Valor de porcentaje de cubrimiento de cada punto con alternancia rápida */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle100(pt);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-transform active:scale-95 cursor-pointer shadow-xs ${badgeColor}`}
                    title={isDone ? 'Click para marcar 0%' : 'Click para marcar 100%'}
                  >
                    {isDone ? (
                      <span className="flex items-center gap-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>100%</span>
                      </span>
                    ) : (
                      <span>{progress}%</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Popover / Quick Management Drawer when clicking on any point */}
      {selectedPoint && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Identity */}
            <div className="flex items-center gap-3.5">
              <div className={`min-w-12 h-12 px-3 rounded-xl flex items-center justify-center font-mono font-black text-sm border-2 shadow-md ${
                is100Percent(selectedPoint)
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : getPointProgress(selectedPoint) > 0
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-rose-500 text-white border-rose-400'
              }`}>
                {getNomenclature(selectedPoint)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">
                    {getNomenclature(selectedPoint)} · {getCleanComponentName(selectedPoint)}
                  </h4>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                    is100Percent(selectedPoint)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${is100Percent(selectedPoint) ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span>{is100Percent(selectedPoint) ? '100% Verde (Completado)' : 'Rojo (<100% Pendiente)'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identificación EQUIPO: <span className="font-mono text-sky-400 font-bold">{getNomenclature(selectedPoint)}</span> · {formatBoxId(selectedPoint.boxId)} (Canal {selectedPoint.boxChannel}) · Técnico: {selectedPoint.technician || 'No asignado'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 1-Click Toggle 100% */}
              <button
                onClick={() => handleToggle100(selectedPoint)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                  is100Percent(selectedPoint)
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {is100Percent(selectedPoint) ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                    <span>Cambiar a Rojo (0%)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Activar en Verde (100%)</span>
                  </>
                )}
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

              {/* Individual Stage Checkboxes */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleToggleStage(selectedPoint, 'sensorMounted')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedPoint.stages?.sensorMounted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span>{selectedPoint.stages?.sensorMounted ? '✓' : '○'}</span>
                  <span>Sensor</span>
                </button>

                <button
                  onClick={() => handleToggleStage(selectedPoint, 'cablePulled')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedPoint.stages?.cablePulled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span>{selectedPoint.stages?.cablePulled ? '✓' : '○'}</span>
                  <span>Cable</span>
                </button>

                <button
                  onClick={() => handleToggleStage(selectedPoint, 'connectedToJB')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedPoint.stages?.connectedToJB
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span>{selectedPoint.stages?.connectedToJB ? '✓' : '○'}</span>
                  <span>Conexión JB</span>
                </button>
              </div>

              {/* Modal full view */}
              {onSelectPoint && (
                <button
                  onClick={() => onSelectPoint(selectedPoint)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-1 transition-colors cursor-pointer"
                >
                  <span>Ficha</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close */}
              <button
                onClick={() => setSelectedPointId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
