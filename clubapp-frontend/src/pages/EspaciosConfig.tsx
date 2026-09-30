import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, ChevronDown, MapPin, LocateFixed } from 'lucide-react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

import type { Space, SaveSpaceRequest, ModalMode } from '../types/space';
import { SPORT_CATEGORIES, shouldDisableReservationsByDefault } from '../types/space';
import { spaceService } from '../services/spaceService';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

// Define local defaultRequest since it's no longer exported
const getNewSpaceData = (): SaveSpaceRequest => ({
  name: '',
  sportCategory: SPORT_CATEGORIES[0],
  location: '',
  lat: -34.6037, // Default to Buenos Aires
  lng: -58.3816,
  isActive: true,
  allowReservations: !shouldDisableReservationsByDefault(SPORT_CATEGORIES[0]),
});

const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-400">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 transition-all duration-200 ${checked ? 'bg-emerald-500' : 'bg-slate-700/80'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default function EspaciosConfig() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  const [formData, setFormData] = useState<SaveSpaceRequest>(getNewSpaceData());

  const [isMapOpen, setIsMapOpen] = useState(false);
  const darkStyle = [
    { elementType: 'geometry', stylers: [{ color: '#0b1b2a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#2a6f97' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1b2a' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1b3a5a' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1b3a5a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0f2d44' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0b1b2a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#062033' }] },
  ];



  const load = async () => {
    try {
      setLoading(true);
      const data = await spaceService.getSpaces();
      setSpaces(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenModal = (mode: ModalMode, space: Space | null = null) => {
    setModalMode(mode);
    setSelectedSpace(space);
    if (mode === 'edit' && space) {
      setFormData({
        name: space.name,
        sportCategory: space.sportCategory,
        location: space.location,
        isActive: space.isActive,
        allowReservations: space.allowReservations,
      });
    } else {
      setFormData(getNewSpaceData());
    }
  };

  const handleCategoryChange = (category: string) => {
    const shouldDisable = shouldDisableReservationsByDefault(category);
    setFormData((prev) => ({
      ...prev,
      sportCategory: category,
      allowReservations: !shouldDisable,
    }));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const term = normalize(searchTerm);
    
    return [...SPORT_CATEGORIES].sort((a, b) => {
      const normA = normalize(a);
      const normB = normalize(b);
      
      const startsA = normA.startsWith(term);
      const startsB = normB.startsWith(term);
      
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      
      return normA.localeCompare(normB);
    }).filter(cat => normalize(cat).includes(term));
  }, [searchTerm]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectCategory = (cat: string) => {
    handleCategoryChange(cat);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await spaceService.createSpace(formData);
      } else if (modalMode === 'edit' && selectedSpace) {
        await spaceService.updateSpace(selectedSpace.id, formData);
      }
      setModalMode(null);
      load();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el espacio');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">
          <h2 className="text-2xl font-bold">Espacios &amp; Canchas</h2>
          <p className="text-sm text-slate-400 mt-1">Gestioná canchas/espacios y su configuración de reservas.</p>

          <div className="mt-6 flex items-center justify-between gap-4">
            {loading ? (
              <div />
            ) : (
              <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                Activos: {spaces.filter(s => s.isActive).length}/{spaces.length}
              </div>
            )}

            <button
              onClick={() => handleOpenModal('create')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Nuevo Espacio
            </button>
          </div>

          {loading ? (
            <p className="mt-6 text-slate-300">Cargando...</p>
          ) : spaces.length === 0 ? (
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              No hay espacios configurados.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {spaces.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900 p-4 rounded-lg flex items-center justify-between border border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate">{s.name}</h3>
                      {!s.isActive && (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          Mantenimiento
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {s.sportCategory} • {s.location}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.allowReservations
                        ? 'Permite reservas'
                        : 'Bloqueo de Alquileres Privados'}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleOpenModal('edit', s)}
                      className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 border border-slate-700" title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 bg-red-900/20 text-red-400 rounded-md hover:bg-red-900/40 border border-red-900/20" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {modalMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">{modalMode === 'create' ? 'Nuevo Espacio' : 'Editar Espacio'}</h3>
                    <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Nombre del Espacio</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Deporte / Categoría</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={toggleDropdown}
                          className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none flex items-center justify-between"
                        >
                          {formData.sportCategory}
                          <ChevronDown size={16} />
                        </button>
                        {isDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-slate-800">
                            <div className="p-2 border-b border-slate-800">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar deporte..."
                                className="w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 outline-none border border-slate-700 rounded-md p-2 text-sm focus:border-emerald-500"
                              />
                            </div>
                            {filteredCategories.map((cat: string) => (
                              <div
                                key={cat}
                                onClick={() => selectCategory(cat)}
                                className="hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer p-2.5 text-sm transition-colors text-slate-100"
                              >
                                {cat}
                              </div>
                            ))}
                            {filteredCategories.length === 0 && (
                              <div className="p-2.5 text-sm text-slate-400">Sin resultados</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Ubicación / Sector</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="location"
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="flex-1 bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                          placeholder="Ubicación / Sector"
                        />
                        <button
                          type="button"
                          onClick={() => setIsMapOpen(true)}
                          className="p-2.5 bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500 transition-colors"
                          title="Seleccionar en el mapa"
                        >
                          <MapPin size={18} />
                        </button>
                      </div>
                    </div>

                    <Toggle
                      label="Permitir Alquileres Privados (Socios)"
                      checked={formData.allowReservations}
                      onChange={(val) => setFormData({...formData, allowReservations: val})}
                    />

                    <Toggle
                      label="Espacio Activo"
                      checked={formData.isActive}
                      onChange={(val) => setFormData({...formData, isActive: val})}
                    />

                    <button
                      type="submit"
                      className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Guardar Cambios
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isMapOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-white">Seleccionar Ubicación</h3>
                  <button onClick={() => setIsMapOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="h-96">
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
  <Map
    style={{ width: '100%', height: '100%' }}
    defaultCenter={{ lat: formData.lat || -34.6037, lng: formData.lng || -58.3816 }}
    defaultZoom={15}
    mapId="map-id"
    options={{ styles: darkStyle }}
  >
    <Marker
      position={{ lat: formData.lat || -34.6037, lng: formData.lng || -58.3816 }}
      draggable={true}
      onDragEnd={(e) => {
        const newLat = e.detail.latLng?.lat;
        const newLng = e.detail.latLng?.lng;
        if (newLat && newLng) {
          setFormData(prev => ({ ...prev, lat: newLat, lng: newLng }));
        }
      }}
    />
  </Map>
</APIProvider>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.geolocation.getCurrentPosition(pos => {
                        const { latitude, longitude } = pos.coords;
                        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    <LocateFixed size={16} /> Mi ubicación
                  </button>
                  <button
                    onClick={() => setIsMapOpen(false)}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-600"
                  >
                    Confirmar Ubicación
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}



