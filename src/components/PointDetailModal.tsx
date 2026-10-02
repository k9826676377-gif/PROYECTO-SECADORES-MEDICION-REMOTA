import React, { useState, useEffect } from 'react';
import { MeasurementPoint, PointStatus, PointType, BoxId } from '../types';
import { getCleanComponentName } from './PointsTable';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Activity, 
  FileText, 
  DollarSign, 
  Trash2, 
  Tag, 
  Cpu, 
  Zap, 
  Package, 
  Layers, 
  Box, 
  CheckCircle2, 
  Circle, 
  Hash, 
  AlertCircle, 
  Check,
  MapPin
} from 'lucide-react';

interface PointDetailModalProps {
  point: MeasurementPoint | null;
  allPoints: MeasurementPoint[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPoint: MeasurementPoint) => void;
  onSelectPoint: (point: MeasurementPoint) => void;
  onDelete?: (pointId: string) => void;
}

export const PointDetailModal: React.FC<PointDetailModalProps> = ({
  point,
  allPoints,
  isOpen,
  onClose,
  onSave,
  onSelectPoint,
  onDelete
}) => {
  const [formData, setFormData] = useState<MeasurementPoint | null>(point);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (point) {
      setFormData({ 
        ...point,
        name: getCleanComponentName(point)
      });
      setShowDeleteConfirm(false);
    }
  }, [point]);

  if (!isOpen || !point || !formData) return null;

  // Find index for Previous / Next navigation
  const currentIndex = allPoints.findIndex(p => p.id === point.id);
  const prevPoint = currentIndex > 0 ? allPoints[currentIndex - 1] : null;
  const nextPoint = currentIndex < allPoints.length - 1 ? allPoints[currentIndex + 1] : null;

  const handleBoxChange = (newBoxId: BoxId) => {
    let newArea: 1 | 2 | 3 | 4 = 1;
    if (newBoxId.toLowerCase().includes('sotano') || newBoxId.toLowerCase().includes('sótano')) newArea = 4;
    else if (newBoxId === 'JB #2' || newBoxId === 'JB Area 2' || newBoxId === 'JB-02') newArea = 2;
    else if (newBoxId === 'JB #3' || newBoxId === 'JB Area 3' || newBoxId === 'JB-03') newArea = 3;
    
    setFormData({ 
      ...formData, 
      boxId: newBoxId,
      area: newArea
    });
  };

  const handleAreaChange = (newAreaStr: string) => {
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

    setFormData({
      ...formData,
      area: newArea,
      boxId: newBox
    });
  };

  const handleToggleStage = (key: keyof typeof formData.stages) => {
    const updatedStages = {
      ...formData.stages,
      [key]: !formData.stages[key]
    };
    setFormData({
      ...formData,
      stages: updatedStages
    });
  };

  const handleSave = () => {
    const hasBias = formData.biasVoltage !== undefined && !isNaN(formData.biasVoltage) && formData.biasVoltage > 0;
    const updatedStages = {
      ...formData.stages,
      biasVerified: hasBias || formData.stages.biasVerified,
      vibrationTestOk: hasBias ? true : formData.stages.vibrationTestOk
    };

    const completedCount = 
      (updatedStages.sensorMounted ? 1 : 0) +
      (updatedStages.cablePulled ? 1 : 0) +
      (updatedStages.connectedToJB ? 1 : 0);

    let newStatus: PointStatus = 'pending';
    if (completedCount === 3) newStatus = 'verified';
    else if (completedCount >= 2) newStatus = 'installed';
    else if (completedCount >= 1) newStatus = 'in_progress';

    onSave({
      ...formData,
      tag: formData.tag.trim(),
      name: formData.name.trim(),
      stages: updatedStages,
      status: newStatus
    });
    onClose();
  };

  const getBiasVoltageStatus = (v?: number) => {
    if (v === undefined || isNaN(v)) return { text: 'No medido', color: 'text-slate-400' };
    if (v >= 10 && v <= 14) return { text: 'Normal (10-14 VDC)', color: 'text-emerald-600 font-semibold' };
    if (v < 10) return { text: 'Bajo (Posible circuito abierto o falla sensor)', color: 'text-rose-600 font-semibold' };
    return { text: 'Alto (Revisar conexión / corto)', color: 'text-amber-600 font-semibold' };
  };

  return (
    <div id="point-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        id="point-detail-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-sky-400 font-bold block uppercase tracking-wider">
                Smurfit Westrock · Packaging Solutions
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-tight text-white">
                  {formData.tag || 'SIN TAG'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-semibold">
                  {formData.boxId} · CH-{formData.boxChannel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  {formData.type === 'dryer' ? 'Secador' : formData.type === 'pinion' ? 'Piñón' : 'Rodillo Lona'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.name || getCleanComponentName(formData)} · {formData.side} · {formData.area === 4 || String(formData.area).toLowerCase().includes('sotano') ? 'Área Sótano' : `Área ${formData.area}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nav buttons */}
            <button
              id="prev-point-nav-btn"
              disabled={!prevPoint}
              onClick={() => prevPoint && onSelectPoint(prevPoint)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title={prevPoint ? `Anterior: ${prevPoint.tag}` : 'No hay anterior'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="next-point-nav-btn"
              disabled={!nextPoint}
              onClick={() => nextPoint && onSelectPoint(nextPoint)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title={nextPoint ? `Siguiente: ${nextPoint.tag}` : 'No hay siguiente'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="close-point-modal-btn"
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* SECCIÓN PRINCIPAL: NOMENCLATURA, COMPONENTE MECÁNICO, TIPO, CAJA CONEXIONES & CH */}
          <div className="bg-sky-50/60 border border-sky-200/90 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Identificación y Ubicación del Punto de Medición
                </h3>
              </div>
              <span className="text-[11px] font-medium text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                Campos Editables
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              
              {/* 1. EQUIPO */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-sky-600" />
                  <span>EQUIPO</span>
                </label>
                <div className="relative">
                  <input
                    id="edit-point-tag-input"
                    type="text"
                    required
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Ej: 1S, P-AA, 1R"
                    className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-sky-950 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Consecutivo / Tag en plano</p>
              </div>

              {/* 2. DESCRIPCIÓN */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-600" />
                  <span>DESCRIPCIÓN</span>
                </label>
                <input
                  id="edit-point-name-input"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Secador #1, Piñón Intermedio, Rodillo de Lona"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Nombre del activo</p>
              </div>

              {/* 3. TIPO */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>TIPO</span>
                </label>
                <select
                  id="edit-point-type-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PointType })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                >
                  <option value="dryer">Secador</option>
                  <option value="felt_roll_upper">Rodillo de Lona</option>
                  <option value="felt_roll_pocket">Rodillo de Lona (Bolsillo)</option>
                  <option value="pinion">Piñón Intermedio</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Categoría mecánica</p>
              </div>

              {/* 4. ÁREA */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ÁREA</span>
                </label>
                <select
                  id="edit-point-area-select"
                  value={formData.area === 4 || String(formData.area).toLowerCase().includes('sotano') ? '4' : String(formData.area || 1)}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                  title="Área operativa del equipo"
                >
                  <option value="1">Área 1</option>
                  <option value="2">Área 2</option>
                  <option value="3">Área 3</option>
                  <option value="4">Área Sótano</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Ubicación física</p>
              </div>

              {/* 5. CAJA */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-indigo-600" />
                  <span>CAJA</span>
                </label>
                <select
                  id="edit-point-box-select"
                  value={formData.boxId}
                  onChange={(e) => handleBoxChange(e.target.value as BoxId)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                  title="Caja de conexiones"
                >
                  <option value="JB #1">JB #1</option>
                  <option value="JB #2">JB #2</option>
                  <option value="JB #3">JB #3</option>
                  <option value="Área Sótano">Área Sótano</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Caja remota</p>
              </div>

              {/* 6. CH */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-600" />
                  <span>CH</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-[10px] font-mono font-bold text-slate-400 select-none">CH-</span>
                  <input
                    id="edit-point-channel-input"
                    type="number"
                    min="1"
                    max="80"
                    value={formData.boxChannel}
                    onChange={(e) => setFormData({ ...formData, boxChannel: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-xs"
                    title="Canal en la bornera (1 a 80)"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Canal (1 a 80)</p>
              </div>

            </div>
          </div>

          {/* DILIGENCIAMIENTO TÉCNICO Y SEÑAL */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Parámetros de Medición y Cableado</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Serial del Acelerómetro */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serial del Acelerómetro</label>
                <input
                  id="point-sensor-serial-input"
                  type="text"
                  value={formData.sensorSerial}
                  onChange={(e) => setFormData({ ...formData, sensorSerial: e.target.value })}
                  placeholder="Ej: SN-AC-89201"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              {/* Voltaje de Bias */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Bias Voltage (VDC)</span>
                  <span className="text-[10px] text-slate-500">ICP / IEPE</span>
                </label>
                <div className="relative">
                  <input
                    id="point-bias-voltage-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={formData.biasVoltage !== undefined ? formData.biasVoltage : ''}
                    onChange={(e) => setFormData({ ...formData, biasVoltage: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="12.0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">V</span>
                </div>
                <p className={`text-[10px] mt-1 ${getBiasVoltageStatus(formData.biasVoltage).color}`}>
                  {getBiasVoltageStatus(formData.biasVoltage).text}
                </p>
              </div>

              {/* Longitud Cable (m) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitud Cable (m)</label>
                <input
                  id="point-cable-meters-input"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.cableMeters}
                  onChange={(e) => setFormData({ ...formData, cableMeters: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1">Metros tendidos hasta JB</p>
              </div>
            </div>

            {/* MÉTODO DE MONTAJE: DISCO MONTAJE vs PERFORACIÓN */}
            {/* Condición: NUEVO / VIEJO */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Condición del Equipo (Seleccionar NUEVO o VIEJO)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="modal-condition-nuevo-btn"
                  onClick={() => setFormData({
                    ...formData,
                    condition: formData.condition === 'nuevo' ? null : 'nuevo'
                  })}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                    formData.condition === 'nuevo'
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">NUEVO</span>
                  {formData.condition === 'nuevo' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  id="modal-condition-viejo-btn"
                  onClick={() => setFormData({
                    ...formData,
                    condition: formData.condition === 'viejo' ? null : 'viejo'
                  })}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                    formData.condition === 'viejo'
                      ? 'bg-amber-600 border-amber-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">VIEJO</span>
                  {formData.condition === 'viejo' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Método de Montaje del Sensor (Seleccionar uno si aplica)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="modal-mounting-disco-btn"
                  onClick={() => setFormData({
                    ...formData,
                    mountingType: formData.mountingType === 'disco' ? null : 'disco'
                  })}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                    formData.mountingType === 'disco'
                      ? 'bg-sky-600 border-sky-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">DISCO MONTAJE</span>
                  {formData.mountingType === 'disco' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  id="modal-mounting-perforacion-btn"
                  onClick={() => setFormData({
                    ...formData,
                    mountingType: formData.mountingType === 'perforacion' ? null : 'perforacion'
                  })}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                    formData.mountingType === 'perforacion'
                      ? 'bg-sky-600 border-sky-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">PERFORACION</span>
                  {formData.mountingType === 'perforacion' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              </div>
            </div>
          </div>

          {/* CHECKLIST DE INSTALACIÓN (Fases de campo) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Etapas de Instalación (Cubrimiento: Sensor, Cable, Conexión)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {(formData.stages.sensorMounted ? 1 : 0) + (formData.stages.cablePulled ? 1 : 0) + (formData.stages.connectedToJB ? 1 : 0)} de 3 completadas
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              
              {/* Sensor Montado */}
              <button
                type="button"
                onClick={() => handleToggleStage('sensorMounted')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formData.stages.sensorMounted 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {formData.stages.sensorMounted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-sky-50 text-sky-600 border border-sky-200 inline-flex items-center justify-center shrink-0">
                      <Cpu className="w-3 h-3" />
                    </span>
                    1. Sensor Montado
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Base/espárrago fijado</div>
                </div>
              </button>

              {/* Cable Tirado */}
              <button
                type="button"
                onClick={() => handleToggleStage('cablePulled')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formData.stages.cablePulled 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {formData.stages.cablePulled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 border border-purple-200 inline-flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3" />
                    </span>
                    2. Cable Tirado
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Canalizado con coraza</div>
                </div>
              </button>

              {/* Conectado a JB */}
              <button
                type="button"
                onClick={() => handleToggleStage('connectedToJB')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formData.stages.connectedToJB 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {formData.stages.connectedToJB ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center justify-center shrink-0">
                      <Package className="w-3 h-3" />
                    </span>
                    3. Conectado a JB
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Bornera {formData.boxId}</div>
                </div>
              </button>

              {/* Bias Verificado */}
              <button
                type="button"
                onClick={() => handleToggleStage('biasVerified')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  formData.stages.biasVerified 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {formData.stages.biasVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold">4. Bias Verificado</div>
                  <div className="text-[10px] text-slate-500 leading-tight">10-14 VDC certificado</div>
                </div>
              </button>

            </div>
          </div>

          {/* Desglose de Costo Asociado a este Punto */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Costo Asociado al Punto de Medición (USD)
              </span>
              <span className="font-mono text-emerald-700 font-bold text-sm">
                Total: ${((formData.costHardware || 0) + (formData.costCableAndConduit || 0) + (formData.costLabor || 0)).toFixed(2)}
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Sensor y Montaje ($)</label>
                <input
                  type="number"
                  value={formData.costHardware}
                  onChange={(e) => setFormData({ ...formData, costHardware: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Cable y Coraza Conduit ($)</label>
                <input
                  type="number"
                  value={formData.costCableAndConduit}
                  onChange={(e) => setFormData({ ...formData, costCableAndConduit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Mano de Obra Instalación ($)</label>
                <input
                  type="number"
                  value={formData.costLabor}
                  onChange={(e) => setFormData({ ...formData, costLabor: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones de Terreno */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observaciones de Terreno y Notas de Montaje
            </label>
            <textarea
              id="point-notes-input"
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detallar condiciones de acceso, vibración anormal durante prueba, interferencia mecánica, etc."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono">
              {formData.tag} · {formData.boxId} · CH-{formData.boxChannel}
            </span>
            {onDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg animate-in fade-in duration-100">
                  <span className="text-xs font-bold text-rose-800">¿Eliminar {formData.tag}?</span>
                  <button
                    id="confirm-modal-delete-btn"
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDelete(formData.id);
                    }}
                    className="px-2 py-0.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  id="delete-point-modal-btn"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Eliminar este punto de medición"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Punto</span>
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              id="cancel-point-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="save-point-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
