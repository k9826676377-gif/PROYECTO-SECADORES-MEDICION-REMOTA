import React, { useState, useRef } from 'react';
import { MaterialItem, MeasurementPoint } from '../types';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Zap, 
  Cpu, 
  TrendingUp,
  Image as ImageIcon,
  Camera,
  Upload,
  ZoomIn,
  LayoutGrid,
  List,
  Link as LinkIcon,
  Check
} from 'lucide-react';

interface MaterialsManagerProps {
  materials: MaterialItem[];
  points: MeasurementPoint[];
  onUpdateMaterials: (updated: MaterialItem[]) => void;
}

// Format currency in Colombian Pesos (COP)
export const formatCOP = (val: number): string => {
  return `$ ${Math.round(val || 0).toLocaleString('es-CO')} COP`;
};

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
  materials,
  points,
  onUpdateMaterials
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // State for in-table inline delete confirmation
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);

  // Lightbox / Image Preview state
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    code: string;
    category?: string;
    supplier?: string;
  } | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialItem['category']>('sensors');
  const [formRequiredQty, setFormRequiredQty] = useState<number>(0);
  const [formInstalledQty, setFormInstalledQty] = useState<number>(0);
  const [formUnitCost, setFormUnitCost] = useState<number>(0);
  const [formSupplier, setFormSupplier] = useState('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar consumo automático con puntos instalados
  const handleSyncWithPoints = () => {
    const installedSensors = points.filter(p => p.stages?.sensorMounted).length;
    const installedCables = points.filter(p => p.stages?.cablePulled).length;

    const updated = materials.map(mat => {
      if (mat.category === 'sensors') {
        return { ...mat, installedQty: installedSensors, requiredQty: points.length };
      }
      if (mat.category === 'cables') {
        return { ...mat, installedQty: installedCables, requiredQty: points.length, unit: 'cables' };
      }
      return mat;
    });

    onUpdateMaterials(updated);
  };

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setFormCode('');
    setFormName('');
    setFormCategory('sensors');
    setFormRequiredQty(0);
    setFormInstalledQty(0);
    setFormUnitCost(0);
    setFormSupplier('');
    setFormImageUrl('');
    setShowUrlInput(false);
    setUrlInputValue('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MaterialItem) => {
    setEditingMaterial(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormRequiredQty(item.requiredQty);
    setFormInstalledQty(item.installedQty);
    setFormUnitCost(item.unitCost);
    setFormSupplier(item.supplier || '');
    setFormImageUrl(item.imageUrl || '');
    setShowUrlInput(false);
    setUrlInputValue(item.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdateMaterials(materials.filter(m => m.id !== id));
    setDeletingMaterialId(null);
  };

  // Image upload handler with client-side canvas compression for optimal storage
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 800x800 for optimal local storage and sharp presentation
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormImageUrl(compressedDataUrl);
        } else {
          setFormImageUrl(event.target?.result as string);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setIsUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleApplyUrl = () => {
    if (urlInputValue.trim()) {
      setFormImageUrl(urlInputValue.trim());
      setShowUrlInput(false);
    }
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    const trimmedImageUrl = formImageUrl.trim() || undefined;

    if (editingMaterial) {
      const updated = materials.map(m => {
        if (m.id === editingMaterial.id) {
          return {
            ...m,
            code: formCode.trim(),
            name: formName.trim(),
            category: formCategory,
            requiredQty: formRequiredQty,
            installedQty: formInstalledQty,
            unitCost: formUnitCost,
            supplier: formSupplier.trim(),
            imageUrl: trimmedImageUrl
          };
        }
        return m;
      });
      onUpdateMaterials(updated);
    } else {
      const newItem: MaterialItem = {
        id: `mat-${Date.now()}`,
        code: formCode.trim(),
        name: formName.trim(),
        category: formCategory,
        unit: 'UND',
        requiredQty: formRequiredQty,
        stockQty: formRequiredQty,
        installedQty: formInstalledQty,
        unitCost: formUnitCost,
        supplier: formSupplier.trim(),
        minStockThreshold: 5,
        imageUrl: trimmedImageUrl
      };
      onUpdateMaterials([...materials, newItem]);
    }

    setIsModalOpen(false);
  };

  // Totals in COP
  const totalInstalledCost = materials.reduce((acc, m) => acc + (m.installedQty * m.unitCost), 0);
  const totalRequiredCost = materials.reduce((acc, m) => acc + (m.requiredQty * m.unitCost), 0);

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory);

  return (
    <div id="materials-manager-card" className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Costo Materiales Instalados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Consumido</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-lg font-bold text-slate-900 mt-2">{formatCOP(totalInstalledCost)}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span>De {formatCOP(totalRequiredCost)} proyectados</span>
          </div>
        </div>

        {/* Sensores */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sensores</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const sensorMat = materials.find(m => m.category === 'sensors');
            return (
              <>
                <p className="font-mono text-xl font-bold text-slate-900 mt-2">
                  {sensorMat ? sensorMat.installedQty : 0} <span className="text-xs text-slate-500 font-normal">instalados</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span>Requeridos: <strong className="text-slate-800 font-mono">{sensorMat ? sensorMat.requiredQty : 0}</strong></span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Cables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cables</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const installedCablesCount = points.filter(p => p.stages?.cablePulled).length;
            const totalRequiredCables = points.length;
            return (
              <>
                <p className="font-mono text-xl font-bold text-slate-900 mt-2">
                  {installedCablesCount} <span className="text-xs text-slate-500 font-normal">instalados</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span>Requeridos: <strong className="text-slate-800 font-mono">{totalRequiredCables}</strong></span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Cajas de Conexiones */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cajas de Conexiones</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const boxMat = materials.find(m => m.category === 'boxes');
            return (
              <>
                <p className="font-mono text-xl font-bold text-slate-900 mt-2">
                  {boxMat ? boxMat.installedQty : 0} / {boxMat ? boxMat.requiredQty : 3} <span className="text-xs text-slate-500 font-normal">cajas en servicio</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span>JB-01, JB-02 y JB-03</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Materials Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-sky-800 tracking-wider uppercase font-mono">
                Smurfit Westrock · Planta Papelera
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Inventario y Control de Materiales del Proyecto
            </h3>
            <p className="text-xs text-slate-500">
              Control fotográfico, consumo en campo y costos de materiales (Pesos Colombianos - COP)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Table vs Cards with Image */}
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs mr-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista tabla detallada"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista tarjetas con fotografía"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Galería</span>
              </button>
            </div>

            <button
              id="sync-materials-btn"
              onClick={handleSyncWithPoints}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Calcular consumo automático con base en rodillos instalados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Sincronizar con Avance</span>
            </button>
            <button
              id="add-material-btn"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Material
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: 'Todos los Materiales' },
            { id: 'sensors', label: 'Sensores' },
            { id: 'cables', label: 'Cables' },
            { id: 'boxes', label: 'Cajas de Conexiones' },
            { id: 'accessories', label: 'Accesorios / Marcación' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode 1: Table View */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-center w-16">Foto</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Descripción de Material</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Requerido</th>
                  <th className="p-3 text-right">Instalado</th>
                  <th className="p-3 text-right">Costo Unit. (COP)</th>
                  <th className="p-3 text-right">Costo Consumido (COP)</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMaterials.map((item) => {
                  const totalItemSpent = item.installedQty * item.unitCost;
                  const isDeleting = deletingMaterialId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Image Thumbnail Column */}
                      <td className="p-2.5 text-center">
                        {item.imageUrl ? (
                          <div 
                            onClick={() => setPreviewImage({ 
                              url: item.imageUrl!, 
                              title: item.name, 
                              code: item.code,
                              category: item.category,
                              supplier: item.supplier
                            })}
                            className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs mx-auto cursor-pointer bg-slate-100 hover:ring-2 hover:ring-sky-500 transition-all shrink-0"
                            title="Clic para ampliar imagen del material"
                          >
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="w-12 h-12 rounded-lg border border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/60 flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 transition-colors mx-auto cursor-pointer group"
                            title="Adjuntar foto de este material"
                          >
                            <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-semibold mt-0.5 leading-none">+ Foto</span>
                          </button>
                        )}
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900">
                        {item.code}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 max-w-sm">{item.name}</div>
                        {item.supplier && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Prov: {item.supplier}</div>
                        )}
                      </td>
                      <td className="p-3 capitalize font-medium text-slate-700">
                        {item.category === 'sensors' ? 'Sensores' : item.category === 'cables' ? 'Cables' : item.category === 'boxes' ? 'Cajas de Conexiones' : item.category}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-800">
                        {item.requiredQty.toLocaleString()} {item.unit || 'UND'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sky-700">
                        {item.installedQty.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-800">
                        {formatCOP(item.unitCost)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {formatCOP(totalItemSpent)}
                      </td>
                      <td className="p-3 text-right">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-rose-700">¿Eliminar?</span>
                            <button
                              id={`confirm-delete-mat-${item.id}`}
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingMaterialId(null)}
                              className="px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-material-btn-${item.id}`}
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                              title="Editar material / adjuntar foto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-material-btn-${item.id}`}
                              onClick={() => setDeletingMaterialId(item.id)}
                              className="p-1.5 px-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 font-medium text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Eliminar material"
                              aria-label={`Eliminar material ${item.code}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Cards / Visual Gallery View */
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
            {filteredMaterials.map((item) => {
              const totalItemSpent = item.installedQty * item.unitCost;
              const progressPct = item.requiredQty > 0 
                ? Math.min(100, Math.round((item.installedQty / item.requiredQty) * 100)) 
                : 0;

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
                >
                  {/* Card Image Header */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {item.imageUrl ? (
                      <>
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setPreviewImage({ 
                            url: item.imageUrl!, 
                            title: item.name, 
                            code: item.code,
                            category: item.category,
                            supplier: item.supplier
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ 
                            url: item.imageUrl!, 
                            title: item.name, 
                            code: item.code,
                            category: item.category,
                            supplier: item.supplier
                          })}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
                          title="Ampliar foto"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div 
                        onClick={() => handleOpenEdit(item)}
                        className="flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 transition-colors cursor-pointer p-4 text-center w-full h-full border border-dashed border-slate-200 m-2 rounded-lg bg-slate-50/80"
                      >
                        <Camera className="w-8 h-8 stroke-1 mb-1" />
                        <span className="text-xs font-semibold">Sin fotografía</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Clic para adjuntar</span>
                      </div>
                    )}

                    {/* Category & Code Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="font-mono text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded shadow-xs backdrop-blur-xs">
                        {item.code}
                      </span>
                    </div>

                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-white/90 text-slate-700 shadow-xs capitalize backdrop-blur-xs">
                      {item.category === 'sensors' ? 'Sensor' : item.category === 'cables' ? 'Cable' : item.category === 'boxes' ? 'Caja JB' : item.category}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {item.name}
                      </h4>
                      {item.supplier && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Fabricante / Proveedor: <strong className="text-slate-600">{item.supplier}</strong></p>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Instalación en campo:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {item.installedQty} / {item.requiredQty} {item.unit || 'UND'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cost Info & Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Costo Consumido</div>
                        <div className="font-mono text-xs font-bold text-emerald-700">{formatCOP(totalItemSpent)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingMaterial ? 'Editar Material de Proyecto' : 'Agregar Nuevo Material al Catálogo'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-5 space-y-4 text-xs">
              {/* Código & Categoría */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código de Referencia</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ej: 3613840"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="sensors">Sensores</option>
                    <option value="cables">Cables</option>
                    <option value="boxes">Cajas de Conexiones</option>
                    <option value="accessories">Accesorios / Marcación</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Detallada del Material</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: ACELEROMETRO CTC AC208-1A"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Cantidad & Costo Unitario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad Requerida</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formRequiredQty}
                    onChange={(e) => setFormRequiredQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unitario (COP)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 1437200"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    {formUnitCost > 0 ? formatCOP(formUnitCost) : '$ 0 COP'}
                  </p>
                </div>
              </div>

              {/* Instalado en Campo & Proveedor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instalado en Campo</label>
                  <input
                    type="number"
                    min="0"
                    value={formInstalledQty}
                    onChange={(e) => setFormInstalledQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proveedor / Fabricante</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Ej: CTC"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Fotografía / Imagen del Material Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-600" />
                    Fotografía / Imagen del Material
                  </label>
                  {!formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showUrlInput ? 'Cerrar URL' : 'Ingresar URL web'}
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />

                {/* Image Preview Box if attached */}
                {formImageUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                    <div className="relative group w-16 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img 
                        src={formImageUrl} 
                        alt="Vista previa material" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 flex items-center gap-1 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        Imagen adjuntada
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        Visible en la tabla e inventario general
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Cambiar Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Quitar Foto
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {showUrlInput ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          placeholder="https://ejemplo.com/foto-sensor.jpg"
                          className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Adjuntar
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-3.5 bg-white text-center cursor-pointer transition-colors group flex flex-col items-center justify-center"
                      >
                        <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="font-semibold text-slate-700 text-xs">
                          {isUploadingImage ? 'Procesando imagen...' : 'Haga clic para subir una foto desde su equipo'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Admite JPG, PNG o WEBP (se optimizará automáticamente)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                {editingMaterial && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingMaterial.id);
                      setIsModalOpen(false);
                    }}
                    className="px-3 py-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Material
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar Material
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for Material Image */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700/20 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-600 text-white font-bold">
                  {previewImage.code}
                </span>
                <h4 className="font-bold text-sm mt-1 text-slate-100 line-clamp-1">{previewImage.title}</h4>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100/70 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img 
                src={previewImage.url} 
                alt={previewImage.title}
                className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="text-slate-500 text-[11px]">
                {previewImage.supplier && <span>Fabricante: <strong>{previewImage.supplier}</strong></span>}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

