import React, { useState, useMemo } from 'react';
import { MeasurementPoint, MaterialItem, JunctionBox } from '../types';
import { 
  Printer, 
  BarChart3, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { 
  getNomenclature, 
  getCleanComponentName, 
  getCleanTypeName, 
  formatBoxId 
} from './PointsTable';

interface ProjectProgressDashboardProps {
  points: MeasurementPoint[];
  materials: MaterialItem[];
  junctionBoxes: JunctionBox[];
  onSelectPoint?: (point: MeasurementPoint) => void;
}

type DashboardViewTab = 'overview' | 'equipment' | 'milestones' | 'condition' | 'explorer';

// Helper to determine if a point has the 3 critical milestones completed
export const isPointComplete = (p: MeasurementPoint): boolean => {
  return Boolean(
    p.stages?.sensorMounted && 
    p.stages?.cablePulled && 
    p.stages?.connectedToJB
  );
};

// Helper to calculate milestone percentage (0%, 33%, 67%, 100%)
export const getPointMilestonePercent = (p: MeasurementPoint): number => {
  const count = (p.stages?.sensorMounted ? 1 : 0) +
                (p.stages?.cablePulled ? 1 : 0) +
                (p.stages?.connectedToJB ? 1 : 0);
  return Math.round((count / 3) * 100);
};

// Helper for sub-group statistics
interface MetricGroupStats {
  total: number;
  completed: number;
  pending: number;
  percentCompleted: number;
  sensorsDone: number;
  sensorsPending: number;
  sensorsPercent: number;
  cablesDone: number;
  cablesPending: number;
  cablesPercent: number;
  connectionsDone: number;
  connectionsPending: number;
  connectionsPercent: number;
  overallWorkPercent: number;
}

const computeGroupStats = (pointsList: MeasurementPoint[]): MetricGroupStats => {
  const total = pointsList.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      percentCompleted: 0,
      sensorsDone: 0,
      sensorsPending: 0,
      sensorsPercent: 0,
      cablesDone: 0,
      cablesPending: 0,
      cablesPercent: 0,
      connectionsDone: 0,
      connectionsPending: 0,
      connectionsPercent: 0,
      overallWorkPercent: 0,
    };
  }

  const completed = pointsList.filter(isPointComplete).length;
  const pending = total - completed;
  const percentCompleted = Math.round((completed / total) * 100);

  const sensorsDone = pointsList.filter(p => Boolean(p.stages?.sensorMounted)).length;
  const sensorsPending = total - sensorsDone;
  const sensorsPercent = Math.round((sensorsDone / total) * 100);

  const cablesDone = pointsList.filter(p => Boolean(p.stages?.cablePulled)).length;
  const cablesPending = total - cablesDone;
  const cablesPercent = Math.round((cablesDone / total) * 100);

  const connectionsDone = pointsList.filter(p => Boolean(p.stages?.connectedToJB)).length;
  const connectionsPending = total - connectionsDone;
  const connectionsPercent = Math.round((connectionsDone / total) * 100);

  const overallWorkPercent = Math.round(((sensorsDone + cablesDone + connectionsDone) / (total * 3)) * 100);

  return {
    total,
    completed,
    pending,
    percentCompleted,
    sensorsDone,
    sensorsPending,
    sensorsPercent,
    cablesDone,
    cablesPending,
    cablesPercent,
    connectionsDone,
    connectionsPending,
    connectionsPercent,
    overallWorkPercent,
  };
};

export const ProjectProgressDashboard: React.FC<ProjectProgressDashboardProps> = ({
  points,
  materials,
  junctionBoxes,
  onSelectPoint
}) => {
  // Navigation / active section tab
  const [activeSubTab, setActiveSubTab] = useState<DashboardViewTab>('overview');

  // 1. GLOBAL STATS (Calculated dynamically from points)
  const globalStats = useMemo(() => computeGroupStats(points), [points]);

  // 2. STATS BY EQUIPMENT TYPE (Secadores, Rodillos, Piñones)
  const dryerPoints = useMemo(() => points.filter(p => p.type === 'dryer'), [points]);
  const feltPoints = useMemo(() => points.filter(p => p.type === 'felt_roll_upper' || p.type === 'felt_roll_pocket'), [points]);
  const pinionPoints = useMemo(() => points.filter(p => p.type === 'pinion'), [points]);

  const dryerStats = useMemo(() => computeGroupStats(dryerPoints), [dryerPoints]);
  const feltStats = useMemo(() => computeGroupStats(feltPoints), [feltPoints]);
  const pinionStats = useMemo(() => computeGroupStats(pinionPoints), [pinionPoints]);

  // SVG Donut Component generator
  const renderDonutChart = (
    percent: number, 
    size = 120, 
    strokeWidth = 10, 
    color = '#0284c7', 
    bgColor = '#e2e8f0', 
    centerLabel?: string, 
    centerSublabel?: string
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const safePercent = Math.min(Math.max(percent, 0), 100);
    const strokeDashoffset = circumference - (safePercent / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
          <span className="font-mono font-black text-slate-900 leading-tight" style={{ fontSize: size * 0.22 }}>
            {centerLabel !== undefined ? centerLabel : `${safePercent}%`}
          </span>
          {centerSublabel && (
            <span className="text-slate-500 font-bold uppercase tracking-wider truncate" style={{ fontSize: size * 0.08 }}>
              {centerSublabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="project-progress-dashboard" className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. CORPORATE HEADER & LIVE SYNCHRONIZATION STATUS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Company branding & Dynamic title */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block font-sans">
                  Smurfit Westrock · Molino 4
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Datos Dinámicos en Vivo
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Avance de Proyecto
              </h2>
            </div>
          </div>

          {/* Master Progress Indicator & Print Action */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Global Complete Counter */}
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                Avance
              </span>
              <div className="font-mono text-2xl font-black text-emerald-700 tabular-nums">
                {globalStats.percentCompleted}%
              </div>
            </div>

            {/* Quick Print/PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Imprimir informe o guardar en PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs & Chart Style Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Navigation sub-tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Resumen Ejecutivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('equipment')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'equipment'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Secadores, Rodillos & Piñones</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('milestones')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'milestones'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sensores, Cables & Conexiones</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRIC SCORECARDS: SUMMARY OF WORK ACROSS ALL DIMENSIONS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL EQUIPOS Y COMPLETADOS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Equipos Totales</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-slate-900">{globalStats.total}</span>
              <span className="text-xs font-bold text-slate-500">componentes</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-emerald-700">{globalStats.completed} terminados</span> (100%) · <span className="font-bold text-amber-700">{globalStats.pending} pendientes</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${globalStats.percentCompleted}%` }}
            />
          </div>
        </div>

        {/* Card 2: SENSORES MONTADOS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Sensores Acelerómetros</span>
            <span className="w-3 h-3 rounded-full bg-[#1f77b4]"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-[#1f77b4]">{globalStats.sensorsDone}</span>
              <span className="text-xs font-mono font-bold text-slate-500">/ {globalStats.total} ({globalStats.sensorsPercent}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-emerald-600">{globalStats.sensorsDone} hechos</span> · <span className="font-bold text-amber-600">{globalStats.sensorsPending} pendientes</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#1f77b4] h-full rounded-full transition-all duration-500" 
              style={{ width: `${globalStats.sensorsPercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: CABLES TENDIDOS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Cables Blindados</span>
            <span className="w-3 h-3 rounded-full bg-[#ff7f0e]"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-[#ff7f0e]">{globalStats.cablesDone}</span>
              <span className="text-xs font-mono font-bold text-slate-500">/ {globalStats.total} ({globalStats.cablesPercent}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-emerald-600">{globalStats.cablesDone} hechos</span> · <span className="font-bold text-amber-600">{globalStats.cablesPending} pendientes</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#ff7f0e] h-full rounded-full transition-all duration-500" 
              style={{ width: `${globalStats.cablesPercent}%` }}
            />
          </div>
        </div>

        {/* Card 4: CONEXIONES A BORNERAS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Conexiones a JB</span>
            <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-[#10b981]">{globalStats.connectionsDone}</span>
              <span className="text-xs font-mono font-bold text-slate-500">/ {globalStats.total} ({globalStats.connectionsPercent}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-emerald-600">{globalStats.connectionsDone} hechos</span> · <span className="font-bold text-amber-600">{globalStats.connectionsPending} pendientes</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#10b981] h-full rounded-full transition-all duration-500" 
              style={{ width: `${globalStats.connectionsPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: SECADORES, RODILLOS Y PIÑONES (USER CORE REQUEST) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'equipment') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                Resumen de Avance en Secadores, Rodillos y Piñones
              </h3>
              <p className="text-xs text-slate-500">
                Progreso comparativo desglosado por familia cinemática en la sección de secado
              </p>
            </div>
          </div>

          {/* Cards for Total & each Equipment Type with Circular/Donut only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: TOTAL PROYECTO */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    TOTAL PROYECTO
                  </span>
                  <div className="text-xs text-slate-600 font-medium mt-1">
                    Todos los componentes M4
                  </div>
                </div>
                <span className="font-mono text-xl font-black text-emerald-950">
                  {globalStats.total} pts
                </span>
              </div>

              {/* Visual chart: Circular Donut */}
              <div className="flex items-center justify-around py-3">
                {renderDonutChart(globalStats.percentCompleted, 110, 10, '#059669', '#d1fae5', `${globalStats.percentCompleted}%`, 'Completado')}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-600">
                    Total: <strong className="text-slate-900 font-bold">{globalStats.total}</strong>
                  </div>
                  <div className="text-emerald-700">
                    Listos: <strong className="font-black">{globalStats.completed}</strong>
                  </div>
                  <div className="text-amber-800">
                    Pendientes: <strong className="font-black">{globalStats.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: SECADORES */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    SECADORES (1S a 48S)
                  </span>
                  <div className="text-xs text-slate-600 font-medium mt-1">
                    Cilindros rotativos a vapor
                  </div>
                </div>
                <span className="font-mono text-xl font-black text-amber-950">
                  {dryerStats.total} pts
                </span>
              </div>

              {/* Visual chart: Circular Donut */}
              <div className="flex items-center justify-around py-3">
                {renderDonutChart(dryerStats.percentCompleted, 110, 10, '#d97706', '#fef3c7', `${dryerStats.percentCompleted}%`, 'Completado')}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-600">
                    Total: <strong className="text-slate-900 font-bold">{dryerStats.total}</strong>
                  </div>
                  <div className="text-emerald-700">
                    Listos: <strong className="font-black">{dryerStats.completed}</strong>
                  </div>
                  <div className="text-amber-800">
                    Pendientes: <strong className="font-black">{dryerStats.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: RODILLOS */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30 hover:border-sky-400 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300">
                    RODILLOS (1R a 83R)
                  </span>
                  <div className="text-xs text-slate-600 font-medium mt-1">
                    Rodillos tensores y guía de lona
                  </div>
                </div>
                <span className="font-mono text-xl font-black text-sky-950">
                  {feltStats.total} pts
                </span>
              </div>

              {/* Visual chart: Circular Donut */}
              <div className="flex items-center justify-around py-3">
                {renderDonutChart(feltStats.percentCompleted, 110, 10, '#0284c7', '#e0f2fe', `${feltStats.percentCompleted}%`, 'Completado')}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-600">
                    Total: <strong className="text-slate-900 font-bold">{feltStats.total}</strong>
                  </div>
                  <div className="text-emerald-700">
                    Listos: <strong className="font-black">{feltStats.completed}</strong>
                  </div>
                  <div className="text-amber-800">
                    Pendientes: <strong className="font-black">{feltStats.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: PIÑONES */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 hover:border-purple-400 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                    PIÑONES (P-AA a P-XXIX)
                  </span>
                  <div className="text-xs text-slate-600 font-medium mt-1">
                    Piñones impulsores e intermedios
                  </div>
                </div>
                <span className="font-mono text-xl font-black text-purple-950">
                  {pinionStats.total} pts
                </span>
              </div>

              {/* Visual chart: Circular Donut */}
              <div className="flex items-center justify-around py-3">
                {renderDonutChart(pinionStats.percentCompleted, 110, 10, '#9333ea', '#f3e8ff', `${pinionStats.percentCompleted}%`, 'Completado')}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-600">
                    Total: <strong className="text-slate-900 font-bold">{pinionStats.total}</strong>
                  </div>
                  <div className="text-emerald-700">
                    Listos: <strong className="font-black">{pinionStats.completed}</strong>
                  </div>
                  <div className="text-amber-800">
                    Pendientes: <strong className="font-black">{pinionStats.pending}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECTION: HITOS DETALLADOS - SENSORES, CABLES & CONEXIONES */}
      {/* ========================================================================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'milestones') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Estado de Hitos: Sensores, Cables y Conexiones (Hechos vs Pendientes)
              </h3>
              <p className="text-xs text-slate-500">
                Visualización detallada de cuáles elementos físicos están completados y cuáles faltan por instalar
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-500">Total Hitos a Instalar:</span>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {globalStats.total * 3} hitos
              </span>
            </div>
          </div>

          {/* 3 Large Milestone Detailed Cards: Sensor, Cable, Conexion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* MILESTONE 1: SENSORES */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1f77b4]"></span>
                  <span className="text-sm font-bold text-slate-900">Sensores Acelerómetros</span>
                </div>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {globalStats.sensorsPercent}%
                </span>
              </div>

              {/* Circular Gauge + Hechos vs Pendientes Counter */}
              <div className="flex items-center justify-around py-2">
                {renderDonutChart(globalStats.sensorsPercent, 100, 9, '#1f77b4', '#e2e8f0', `${globalStats.sensorsPercent}%`)}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Hechos (Instalados)</div>
                    <div className="text-lg font-black">{globalStats.sensorsDone} pts</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="text-[10px] uppercase font-bold text-amber-700">Pendientes (Por Montar)</div>
                    <div className="text-lg font-black">{globalStats.sensorsPending} pts</div>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown bar */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span className="text-emerald-700 font-bold">{globalStats.sensorsDone} hechos</span>
                  <span className="text-amber-700 font-bold">{globalStats.sensorsPending} pendientes</span>
                </div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#1f77b4] h-full transition-all duration-500" 
                    style={{ width: `${globalStats.sensorsPercent}%` }} 
                    title={`Hechos: ${globalStats.sensorsPercent}%`}
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    style={{ width: `${100 - globalStats.sensorsPercent}%` }} 
                    title={`Pendientes: ${100 - globalStats.sensorsPercent}%`}
                  />
                </div>
              </div>
            </div>

            {/* MILESTONE 2: CABLES */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-300 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ff7f0e]"></span>
                  <span className="text-sm font-bold text-slate-900">Cables Blindados</span>
                </div>
                <span className="font-mono text-xs font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {globalStats.cablesPercent}%
                </span>
              </div>

              {/* Circular Gauge + Hechos vs Pendientes Counter */}
              <div className="flex items-center justify-around py-2">
                {renderDonutChart(globalStats.cablesPercent, 100, 9, '#ff7f0e', '#e2e8f0', `${globalStats.cablesPercent}%`)}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Hechos (Tendidos)</div>
                    <div className="text-lg font-black">{globalStats.cablesDone} pts</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="text-[10px] uppercase font-bold text-amber-700">Pendientes (Por Tirar)</div>
                    <div className="text-lg font-black">{globalStats.cablesPending} pts</div>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown bar */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span className="text-emerald-700 font-bold">{globalStats.cablesDone} hechos</span>
                  <span className="text-amber-700 font-bold">{globalStats.cablesPending} pendientes</span>
                </div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#ff7f0e] h-full transition-all duration-500" 
                    style={{ width: `${globalStats.cablesPercent}%` }} 
                    title={`Hechos: ${globalStats.cablesPercent}%`}
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    style={{ width: `${100 - globalStats.cablesPercent}%` }} 
                    title={`Pendientes: ${100 - globalStats.cablesPercent}%`}
                  />
                </div>
              </div>
            </div>

            {/* MILESTONE 3: CONEXIONES */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10b981]"></span>
                  <span className="text-sm font-bold text-slate-900">Conexiones a Borneras</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {globalStats.connectionsPercent}%
                </span>
              </div>

              {/* Circular Gauge + Hechos vs Pendientes Counter */}
              <div className="flex items-center justify-around py-2">
                {renderDonutChart(globalStats.connectionsPercent, 100, 9, '#10b981', '#e2e8f0', `${globalStats.connectionsPercent}%`)}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Hechas (Peinadas en JB)</div>
                    <div className="text-lg font-black">{globalStats.connectionsDone} pts</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="text-[10px] uppercase font-bold text-amber-700">Pendientes (Por Conectar)</div>
                    <div className="text-lg font-black">{globalStats.connectionsPending} pts</div>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown bar */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span className="text-emerald-700 font-bold">{globalStats.connectionsDone} hechos</span>
                  <span className="text-amber-700 font-bold">{globalStats.connectionsPending} pendientes</span>
                </div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#10b981] h-full transition-all duration-500" 
                    style={{ width: `${globalStats.connectionsPercent}%` }} 
                    title={`Hechas: ${globalStats.connectionsPercent}%`}
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    style={{ width: `${100 - globalStats.connectionsPercent}%` }} 
                    title={`Pendientes: ${100 - globalStats.connectionsPercent}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};
