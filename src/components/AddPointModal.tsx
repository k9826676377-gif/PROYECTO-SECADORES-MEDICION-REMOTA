import React, { useState } from 'react';
import { MeasurementPoint, PointType, BoxId } from '../types';
import { X, Plus, Save, Activity } from 'lucide-react';

interface AddPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (newPoint: MeasurementPoint) => void;
  existingPoints: MeasurementPoint[];
}

export const AddPointModal: React.FC<AddPointModalProps> = ({
  isOpen,
  onClose,
  onAddPoint,
  existingPoints
}) => {
  const [type, setType] = useState<PointType>('dryer');
  const [tag, setTag] = useState('17S');
  const [name, setName] = useState('Secador #17');
  const [boxId, setBoxId] = useState<BoxId>('JB #1');
  const [boxChannel, setBoxChannel] = useState(1);
  const [cableMeters, setCableMeters] = useState(18);
  const [side, setSide] = useState('Lado transmisión');
  const [condition, setCondition] = useState<'nuevo' | 'viejo' | null>(null);
  const [mountingType, setMountingType] = useState<'disco' | 'perforacion' | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType: PointType) => {
    setType(newType);
    if (newType === 'dryer') {
      setTag('17S');
      setName('Secador #17');
    } else if (newType === 'felt_roll_upper' || newType === 'felt_roll_pocket') {
      const defaultTag = newType === 'felt_roll_upper' ? '1R' : '2R';
      setTag(defaultTag);
      setName(newType === 'felt_roll_upper' ? 'Rodillo de Lona #1' : 'Rodillo de Lona #2');
    } else if (newType === 'pinion') {
      setTag('P-AA');
      setName('Piñón Intermedio');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const areaNum: 1 | 2 | 3 = (boxId === 'JB #2' || boxId === 'JB Area 2') ? 2 : (boxId === 'JB #3' || boxId === 'JB Area 3') ? 3 : 1;

    const newPoint: MeasurementPoint = {
      id: `pt-${Date.now()}`,
      tag: tag.trim(),
      name: name.trim(),
      type,
      boxId,
      boxChannel: Number(boxChannel),
      area: areaNum,
      side: 'Lado transmisión',
      orientation: type === 'pinion' ? 'Radial Horizontal' : 'Radial Vertical',
      sensorModel: type === 'dryer' 
        ? 'Acelerómetro Industrial 100 mV/g Alta Temp 121°C' 
        : 'Acelerómetro Industrial Estándar 100 mV/g ICP',
      cableMeters: Number(cableMeters),
      cableTag: `CBL-${boxId.replace(/\s+/g, '-')}-CH${boxChannel}`,
      sensorSerial: `SN-AC-${Math.floor(10000 + Math.random() * 90000)}`,
      condition,
      mountingType,
      status: 'pending',
      stages: {
        baseMachined: false,
        sensorMounted: false,
        conduitInstalled: false,
        cablePulled: false,
        connectedToJB: false,
        biasVerified: false,
        vibrationTestOk: false,
      },
      costHardware: type === 'dryer' ? 310 : 275,
      costCableAndConduit: Math.round(cableMeters * 5.5),
      costLabor: 90,
      notes: 'Punto agregado por el usuario'
    };

    onAddPoint(newPoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h4 className="font-bold text-sm">Registrar Nuevo Punto de Medición Remota</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tipo de Componente</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('dryer')}
                className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                  type === 'dryer' ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                Secador (1S L3)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('felt_roll_upper')}
                className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                  type === 'felt_roll_upper' ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                Rodillo Superior (1R, 2R...)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('felt_roll_pocket')}
                className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                  type === 'felt_roll_pocket' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                Rodillo Bolsillo (1R, 2R...)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('pinion')}
                className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                  type === 'pinion' ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                Piñones (P-AA, P-A, P-I...)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tag / Nomenclatura Solicitada</label>
              <input
                type="text"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ej: 1S, 2S, 1R, P-AA, P-A, P-I"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre / Ubicación</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Secador #17, Piñón Intermedio, Rodillo de Lona"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Caja Conexiones</label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              >
                <option value="JB #1">JB #1</option>
                <option value="JB #2">JB #2</option>
                <option value="JB #3">JB #3</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CH Canal</label>
              <input
                type="number"
                min="1"
                max="80"
                value={boxChannel}
                onChange={(e) => setBoxChannel(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitud Cable (m)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={cableMeters}
                onChange={(e) => setCableMeters(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lado Mecánico</label>
            <input
              type="text"
              readOnly
              value={side}
              className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Condición del Equipo (Opcional)</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCondition(condition === 'nuevo' ? null : 'nuevo')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  condition === 'nuevo'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <span>NUEVO</span>
              </button>
              <button
                type="button"
                onClick={() => setCondition(condition === 'viejo' ? null : 'viejo')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  condition === 'viejo'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <span>VIEJO</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Método de Montaje (Opcional)</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMountingType(mountingType === 'disco' ? null : 'disco')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mountingType === 'disco'
                    ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <span>DISCO MONTAJE</span>
              </button>
              <button
                type="button"
                onClick={() => setMountingType(mountingType === 'perforacion' ? null : 'perforacion')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mountingType === 'perforacion'
                    ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <span>PERFORACION</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Punto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
