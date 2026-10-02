import React, { useMemo } from 'react';
import { 
  ClipboardList, 
  Package, 
  TrendingUp,
  Zap,
  FileText, 
  Download, 
  Upload,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Compass
} from 'lucide-react';
import { MeasurementPoint } from '../types';

export type ActiveTab = 'points' | 'materials' | 'progress' | 'costs' | 'boxes' | 'area2' | 'area3';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  points: MeasurementPoint[];
  onOpenReport: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData?: () => void;
  syncStatus?: 'syncing' | 'synced' | 'error';
  onForceSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  points,
  onOpenReport,
  onExportBackup,
  onImportBackup,
  syncStatus = 'synced',
  onForceSync
}) => {
  // Helper para determinar si un punto físico está 100% completo (todos sus hitos listos o verificado)
  const isCompletePoint = (p: MeasurementPoint) => Boolean(
    (p.stages?.sensorMounted && p.stages?.cablePulled && p.stages?.connectedToJB) ||
    p.status === 'verified'
  );

  const totalPoints = points.length;
  const completedPoints = useMemo(() => {
    return points.filter(isCompletePoint).length;
  }, [points]);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Nombre de la empresa (solo texto, sin logo) */}
          <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-sans">
            Smurfit Westrock
          </span>

          <div className="border-l border-slate-700/80 pl-3 sm:pl-4">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase">
              PROYECTO MEDICION REMOTA SECADORES MOLINO 4
            </h1>
          </div>
        </div>

        {/* Global Progress Mini Widget */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div 
            className="flex items-center gap-2 sm:gap-3 bg-slate-800/80 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-700/60 text-xs font-mono"
            title={`Avance Instalación: ${completedPoints} de ${totalPoints} (${progressPercent}%)`}
          >
            <span className="text-slate-400 font-sans">Avance Instalación:</span>
            <span className="font-bold text-sky-400 text-sm">{progressPercent}%</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{completedPoints}</span>
            <span className="text-slate-400">/{totalPoints} puntos</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Firebase Cloud Sync Badge & Button */}
            <button
              type="button"
              id="cloud-sync-button"
              onClick={onForceSync}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                syncStatus === 'syncing'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : syncStatus === 'error'
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title={
                syncStatus === 'syncing'
                  ? 'Sincronizando con Firebase en la nube...'
                  : syncStatus === 'error'
                    ? 'Error de conexión. Clic para reintentar sincronizar con Firebase'
                    : 'Sincronizado con Firebase en la nube (accesible desde cualquier computador). Clic para sincronizar ahora.'
              }
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="text-[11px]">Sincronizando...</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px]">Sincronizar</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Sincronizar</span>
                </>
              )}
            </button>

            <button
              id="report-button"
              onClick={onOpenReport}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Generar informe imprimible / PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Informe PDF</span>
            </button>

            {/* Backup export */}
            <button
              id="backup-export-button"
              onClick={onExportBackup}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Descargar copia de seguridad JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Backup import */}
            <label
              htmlFor="backup-import-input"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Restaurar copia de seguridad JSON"
            >
              <Upload className="w-4 h-4" />
              <input
                id="backup-import-input"
                type="file"
                accept=".json"
                onChange={onImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 pt-1 overflow-x-auto">
          <button
            id="tab-points"
            onClick={() => onTabChange('points')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'points'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Listado General
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
              {totalPoints}
            </span>
          </button>

          <button
            id="tab-materials"
            onClick={() => onTabChange('materials')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Package className="w-4 h-4" />
            Materiales e Inventario
          </button>

          <button
            id="tab-progress"
            onClick={() => onTabChange('progress')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'progress' || activeTab === 'costs'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Avance del Proyecto
          </button>

          <button
            id="tab-boxes"
            onClick={() => onTabChange('boxes')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'boxes'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Compass className="w-4 h-4" />
            Visor 2D Area 1
          </button>

          <button
            id="tab-area2"
            onClick={() => onTabChange('area2')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'area2'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Compass className="w-4 h-4" />
            Visor 2D Area 2
          </button>

          <button
            id="tab-area3"
            onClick={() => onTabChange('area3')}
            className={`py-2.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'area3'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Compass className="w-4 h-4" />
            Visor 2D Area 3
          </button>
        </nav>
      </div>
    </header>
  );
};
