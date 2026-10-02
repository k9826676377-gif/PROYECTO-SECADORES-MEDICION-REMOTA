import React, { useState } from 'react';
import { JunctionBox, MeasurementPoint, BoxId } from '../types';
import { getCleanComponentName, formatBoxId } from './PointsTable';
import { 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Zap, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface JunctionBoxOverviewProps {
  boxes: JunctionBox[];
  points: MeasurementPoint[];
  onSelectPoint: (point: MeasurementPoint) => void;
}

export const JunctionBoxOverview: React.FC<JunctionBoxOverviewProps> = ({
  boxes,
  points,
  onSelectPoint
}) => {
  const [activeBoxId, setActiveBoxId] = useState<BoxId>(() => boxes[0]?.id || 'JB #1');

  const activeBox = boxes.find(b => formatBoxId(b.id) === formatBoxId(activeBoxId)) || boxes[0];
  const boxPoints = points.filter(p => formatBoxId(p.boxId) === formatBoxId(activeBox.id));

  // Stats for the active box
  const totalChannels = activeBox.totalChannels || 48;
  const verifiedPoints = boxPoints.filter(p => p.status === 'verified');
  const installedPoints = boxPoints.filter(p => p.status === 'installed');
  const inProgressPoints = boxPoints.filter(p => p.status === 'in_progress');
  const pendingPoints = boxPoints.filter(p => p.status === 'pending');

  // Generate 48 channels list
  const channelsList = Array.from({ length: totalChannels }, (_, i) => {
    const channelNum = i + 1;
    const assignedPoint = boxPoints.find(p => p.boxChannel === channelNum);
    return {
      channelNum,
      point: assignedPoint || null
    };
  });

  return (
    <div id="junction-box-overview-container" className="space-y-6">
      {/* Box Selection Bar */}
      <div className="flex flex-wrap gap-3">
        {boxes.map((box) => {
          const bPoints = points.filter(p => formatBoxId(p.boxId) === formatBoxId(box.id));
          const bVerified = bPoints.filter(p => p.status === 'verified').length;
          const pct = bPoints.length > 0 ? Math.round((bVerified / bPoints.length) * 100) : 0;
          const isActive = formatBoxId(box.id) === formatBoxId(activeBoxId);

          return (
            <button
              key={box.id}
              id={`select-box-btn-${box.id}`}
              onClick={() => setActiveBoxId(box.id)}
              className={`flex-1 min-w-[240px] p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-500/30'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                  isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {formatBoxId(box.id)}
                </span>
                <span className="text-xs font-mono font-bold">
                  {bVerified}/{bPoints.length} Puntos OK
                </span>
              </div>
              <h4 className="font-bold text-sm mt-2">{box.name.replace(/JB\s*Area\s*/i, 'JB #')}</h4>
              <p className={`text-xs mt-1 truncate ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                {box.location}
              </p>

              {/* Progress bar inside card */}
              <div className="w-full bg-slate-200/40 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className={`h-full ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-sky-400' : 'bg-slate-300'}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Box Technical Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm">
              {activeBox.id}
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-800 tracking-wider uppercase font-mono block mb-0.5">
                Smurfit Westrock · Cajas de Conexiones
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{activeBox.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {activeBox.status === 'operational' ? 'Operativa' : 'En Instalación'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {activeBox.location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Canales Utilizados:</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {boxPoints.length} / {totalChannels}
              </span>
            </div>
            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Canales Libres / Reserva:</span>
              <span className="font-mono font-bold text-sm text-emerald-600">
                {totalChannels - boxPoints.length}
              </span>
            </div>
          </div>
        </div>

        {/* Box Enclosure & Grounding Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="font-semibold text-slate-500 uppercase text-[10px] block">Tipo de Envolvente</span>
            <span className="font-medium text-slate-800">{activeBox.enclosureType}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 uppercase text-[10px] block">Borneras y Puesta a Tierra</span>
            <span className="font-medium text-slate-800">Borneras seccionables Weidmuller con puesta a tierra única para apantallamiento FEP</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 uppercase text-[10px] block">Notas de Montaje</span>
            <span className="font-medium text-slate-800">{activeBox.notes}</span>
          </div>
        </div>

        {/* 48-Channel Terminal Strip Grid */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              Mapeo de Canales y Borneras BNC (1 al {totalChannels})
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Verificado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-slate-600">Instalado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">En Proceso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                <span className="text-slate-400">Reserva</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {channelsList.map(({ channelNum, point }) => {
              if (!point) {
                // Free / spare channel
                return (
                  <div
                    key={channelNum}
                    className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between min-h-[76px]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 font-semibold">CH-{channelNum}</span>
                      <span className="text-[10px] text-slate-400">LIBRE</span>
                    </div>
                    <span className="text-[11px] text-slate-400 italic mt-1">Canal de reserva</span>
                  </div>
                );
              }

              // Assigned point
              const isVerified = point.status === 'verified';
              const isInstalled = point.status === 'installed';
              const isInProgress = point.status === 'in_progress';

              return (
                <button
                  key={channelNum}
                  onClick={() => onSelectPoint(point)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between min-h-[76px] transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${
                    isVerified
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500'
                      : isInstalled
                      ? 'bg-sky-50/60 border-sky-300 hover:border-sky-500'
                      : isInProgress
                      ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-slate-800">CH-{channelNum}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isVerified ? 'bg-emerald-500' : isInstalled ? 'bg-sky-500' : isInProgress ? 'bg-amber-500' : 'bg-slate-300'
                    }`}></span>
                  </div>

                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                      {point.tag}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {getCleanComponentName(point)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>{point.biasVoltage ? `${point.biasVoltage}V` : 'Bias N/A'}</span>
                    <span className="text-sky-600 font-sans font-medium hover:underline">Ver</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
