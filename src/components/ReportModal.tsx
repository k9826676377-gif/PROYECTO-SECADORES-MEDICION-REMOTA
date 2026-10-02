import React from 'react';
import { MeasurementPoint, MaterialItem, CostCategory, JunctionBox } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  Package 
} from 'lucide-react';
import { SmurfitWestrockLogo } from './SmurfitWestrockLogo';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: MeasurementPoint[];
  materials: MaterialItem[];
  categories: CostCategory[];
  junctionBoxes: JunctionBox[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  points,
  materials,
  categories,
  junctionBoxes
}) => {
  if (!isOpen) return null;

  const totalPoints = points.length;
  const verifiedPoints = points.filter(p => p.status === 'verified').length;
  const installedPoints = points.filter(p => p.status === 'installed').length;
  const inProgressPoints = points.filter(p => p.status === 'in_progress').length;
  const pendingPoints = points.filter(p => p.status === 'pending').length;
  const globalPercent = totalPoints > 0 ? Math.round(((verifiedPoints + installedPoints) / totalPoints) * 100) : 0;

  const totalBudget = categories.reduce((acc, c) => acc + c.budgeted, 0);
  const totalSpent = categories.reduce((acc, c) => acc + c.spent, 0);

  // Group by type
  const dryers = points.filter(p => p.type === 'dryer');
  const upperFelts = points.filter(p => p.type === 'felt_roll_upper');
  const pocketFelts = points.filter(p => p.type === 'felt_roll_pocket');
  const pinions = points.filter(p => p.type === 'pinion');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="report-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="report-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in"
      >
        {/* Modal Controls Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Informe Ejecutivo de Avance Técnico y Presupuestal</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            {/* Corporate Banner */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <SmurfitWestrockLogo theme="light" size="md" />
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                  Documento Interno Confidencial · Planta Papelera
                </span>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-widest block">
                  SMURFIT WESTROCK · PACKAGING SOLUTIONS · GERENCIA DE MANTENIMIENTO & CONFIABILIDAD
                </span>
                <h1 className="text-xl font-black text-slate-900 mt-1">
                  INFORME DE AVANCE DE INSTALACIÓN: SISTEMA DE MEDICIÓN REMOTA DE VIBRACIONES
                </h1>
                <p className="text-slate-600 font-medium mt-0.5">
                  Línea de Producción - Sección de Secado (3 Cajas de Conexiones NEMA 4X: JB-01, JB-02, JB-03)
                </p>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-500 shrink-0 ml-4">
                <p>Fecha: <strong>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                <p>Código Doc: <strong>SW-VIB-SEC-INF-001</strong></p>
                <p>Revisión: <strong>Rev 2.0 Oficial</strong></p>
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              1. Resumen Ejecutivo del Proyecto
            </h2>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Avance Físico Global</span>
                <span className="text-2xl font-black text-sky-700 font-mono mt-1 block">{globalPercent}%</span>
                <span className="text-[10px] text-slate-500">{verifiedPoints + installedPoints} de {totalPoints} puntos</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Verificados y Operativos</span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">{verifiedPoints}</span>
                <span className="text-[10px] text-slate-500">Bias Voltage validado</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Presupuesto Ejecutado</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  ${totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-500">De ${totalBudget.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cajas de Conexiones</span>
                <span className="text-2xl font-black text-purple-700 font-mono mt-1 block">3</span>
                <span className="text-[10px] text-slate-500">JB-01, JB-02, JB-03</span>
              </div>
            </div>
          </div>

          {/* Breakdown by Equipment Group */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Avance por Tipo de Rodillo y Componente Mecánico
            </h2>
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Grupo de Rodillos</th>
                  <th className="p-2.5">Nomenclatura</th>
                  <th className="p-2.5 text-center">Total Puntos</th>
                  <th className="p-2.5 text-center">Verificados</th>
                  <th className="p-2.5 text-center">Instalados</th>
                  <th className="p-2.5 text-center">En Proceso</th>
                  <th className="p-2.5 text-center">Pendientes</th>
                  <th className="p-2.5 text-right">% Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-bold">Cilindros Secadores (Naranja)</td>
                  <td className="p-2.5 font-mono text-amber-700 font-bold">1S L3</td>
                  <td className="p-2.5 text-center font-mono">{dryers.length}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{dryers.filter(p => p.status === 'verified').length}</td>
                  <td className="p-2.5 text-center font-mono text-sky-700">{dryers.filter(p => p.status === 'installed').length}</td>
                  <td className="p-2.5 text-center font-mono text-amber-700">{dryers.filter(p => p.status === 'in_progress').length}</td>
                  <td className="p-2.5 text-center font-mono">{dryers.filter(p => p.status === 'pending').length}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {Math.round(((dryers.filter(p => p.status === 'verified' || p.status === 'installed').length) / (dryers.length || 1)) * 100)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Rodillos Lona Superior / Retorno (Azul)</td>
                  <td className="p-2.5 font-mono text-sky-700 font-bold">1R L3</td>
                  <td className="p-2.5 text-center font-mono">{upperFelts.length}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{upperFelts.filter(p => p.status === 'verified').length}</td>
                  <td className="p-2.5 text-center font-mono text-sky-700">{upperFelts.filter(p => p.status === 'installed').length}</td>
                  <td className="p-2.5 text-center font-mono text-amber-700">{upperFelts.filter(p => p.status === 'in_progress').length}</td>
                  <td className="p-2.5 text-center font-mono">{upperFelts.filter(p => p.status === 'pending').length}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {Math.round(((upperFelts.filter(p => p.status === 'verified' || p.status === 'installed').length) / (upperFelts.length || 1)) * 100)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Rodillos Lona Bolsillo / Inferiores (Verde)</td>
                  <td className="p-2.5 font-mono text-emerald-700 font-bold">1R L3</td>
                  <td className="p-2.5 text-center font-mono">{pocketFelts.length}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{pocketFelts.filter(p => p.status === 'verified').length}</td>
                  <td className="p-2.5 text-center font-mono text-sky-700">{pocketFelts.filter(p => p.status === 'installed').length}</td>
                  <td className="p-2.5 text-center font-mono text-amber-700">{pocketFelts.filter(p => p.status === 'in_progress').length}</td>
                  <td className="p-2.5 text-center font-mono">{pocketFelts.filter(p => p.status === 'pending').length}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {Math.round(((pocketFelts.filter(p => p.status === 'verified' || p.status === 'installed').length) / (pocketFelts.length || 1)) * 100)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Piñones Intermedios de Mando (Morado)</td>
                  <td className="p-2.5 font-mono text-purple-700 font-bold">P (Letra / Romano)</td>
                  <td className="p-2.5 text-center font-mono">{pinions.length}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{pinions.filter(p => p.status === 'verified').length}</td>
                  <td className="p-2.5 text-center font-mono text-sky-700">{pinions.filter(p => p.status === 'installed').length}</td>
                  <td className="p-2.5 text-center font-mono text-amber-700">{pinions.filter(p => p.status === 'in_progress').length}</td>
                  <td className="p-2.5 text-center font-mono">{pinions.filter(p => p.status === 'pending').length}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {Math.round(((pinions.filter(p => p.status === 'verified' || p.status === 'installed').length) / (pinions.length || 1)) * 100)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Distribution by 3 Junction Boxes */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              3. Estado por Caja de Conexiones (JB)
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {junctionBoxes.map((jb) => {
                const jbPoints = points.filter(p => p.boxId === jb.id);
                const jbDone = jbPoints.filter(p => p.status === 'verified' || p.status === 'installed').length;
                const jbPct = jbPoints.length > 0 ? Math.round((jbDone / jbPoints.length) * 100) : 0;
                return (
                  <div key={jb.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{jb.id}</span>
                      <span className="font-mono font-bold text-sky-700">{jbPct}%</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1">{jb.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{jb.location}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                      <span>Puntos montados:</span>
                      <strong className="font-mono">{jbDone} / {jbPoints.length}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Materials Consumption Table */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              4. Consumo de Materiales en Campo
            </h2>
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-2">Material / Referencia</th>
                  <th className="p-2 text-center">Unidad</th>
                  <th className="p-2 text-right">Requerido</th>
                  <th className="p-2 text-right">Instalado</th>
                  <th className="p-2 text-right">Saldo en Stock</th>
                  <th className="p-2 text-right">Costo Invertido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {materials.slice(0, 6).map((m) => (
                  <tr key={m.id}>
                    <td className="p-2">
                      <span className="font-bold">{m.code}</span> - {m.name}
                    </td>
                    <td className="p-2 text-center">{m.unit}</td>
                    <td className="p-2 text-right font-mono">{m.requiredQty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-sky-700">{m.installedQty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-700">{(m.stockQty - m.installedQty).toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">${(m.installedQty * m.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="border-b border-slate-400 h-10 mb-2"></div>
              <p className="font-bold text-slate-900">Ing. de Confiabilidad y Predictivo</p>
              <p className="text-[10px] text-slate-500 font-medium">Smurfit Westrock · Planta Papelera</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-2"></div>
              <p className="font-bold text-slate-900">Supervisor de Montaje</p>
              <p className="text-[10px] text-slate-500 font-medium">Contratista de Instrumentación Industrial</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-2"></div>
              <p className="font-bold text-slate-900">Gerencia de Mantenimiento</p>
              <p className="text-[10px] text-slate-500 font-medium">Smurfit Westrock Packaging Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
