import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, ChevronDown, MapPin, LocateFixed, ExternalLink, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Space, SaveSpaceRequest, ModalMode } from '../types/space';
import { SPORT_CATEGORIES, shouldDisableReservationsByDefault } from '../types/space';
import { spaceService } from '../services/spaceService';
import { buildNavigationLinks } from '../utils/navigation';
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
  permitir_superposicion: false,
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

const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance?: number;
  text: string;
  place_name: string;
  address?: string;
  center?: [number, number]; // GeoJSON: [longitud, latitud]
  geometry?: { coordinates: [number, number] };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

interface MapboxGeocodingResponse {
  type: string;
  features: MapboxFeature[];
}

// Construye "Calle Altura, Localidad, Provincia" a partir de una feature de Mapbox.
// `place_name` viene formateado por Mapbox como "Calle Altura, Localidad, Provincia CP, País";
// tomamos la primera parte (calle + altura) y la localidad/provincia desde `context`.
const formatMapboxLabel = (f: MapboxFeature): string => {
  const contextText = (prefix: string): string =>
    f.context?.find((c) => c.id.startsWith(prefix))?.text ?? '';
  const primary = f.place_name.split(',')[0]?.trim() || f.text;
  return [primary, contextText('place.'), contextText('region.')]
    .filter(Boolean)
    .join(', ');
};

// Icono de marcador SVG propio para evitar el problema de rutas de Leaflet en bundlers
const locationIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
    <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" fill="#10b981" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="2.5" fill="#0f172a"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Componente hijo que recentra el mapa cuando cambian las coordenadas (búsqueda / GPS)
const MapFlyTo = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.6 });
    }
  }, [position, map]);
  return null;
};

// Captura clics sobre el mapa para mover el pin y hacer geocodificación inversa
const MapClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export default function EspaciosConfig() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [formData, setFormData] = useState<SaveSpaceRequest>(getNewSpaceData());

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([-34.6037, -58.3816]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [helpOpen, setHelpOpen] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const currentLat = formData.lat ?? -34.6037;
  const currentLng = formData.lng ?? -58.3816;

  // Autocompletado con Mapbox Geocoding, filtrado a Argentina (debounce de 400ms)
  useEffect(() => {
    if (locationQuery.trim().length < 3) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          country: 'ar',
          types: 'address,poi',
          language: 'es',
          limit: '5',
        });
        // proximity: [longitud, latitud] del centro/marcador actual
        params.set('proximity', `${currentLng},${currentLat}`);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            locationQuery
          )}.json?${params.toString()}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = (await res.json()) as MapboxGeocodingResponse;
        setSuggestions(Array.isArray(data.features) ? data.features : []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery, currentLat, currentLng]);

  useEffect(() => {
    let cancelled = false;

    spaceService
      .getSpaces()
      .then((data) => {
        if (!cancelled) setSpaces(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const handleOpenModal = (mode: ModalMode, space: Space | null = null) => {
    setModalMode(mode);
    setSelectedSpace(space);
    if (mode === 'edit' && space) {
      setFormData({
        name: space.name,
        sportCategory: space.sportCategory,
        location: space.location,
        lat: space.lat,
        lng: space.lng,
        isActive: space.isActive,
        allowReservations: space.allowReservations,
        permitir_superposicion: space.permitir_superposicion,
      });
    } else {
      setFormData(getNewSpaceData());
    }
    setLocationQuery('');
    setSuggestions([]);
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

  const selectLocationSuggestion = (feature: MapboxFeature) => {
    const coords = feature.center ?? feature.geometry?.coordinates;
    if (!coords) return;
    const [lng, lat] = coords; // Mapbox devuelve GeoJSON: [longitud, latitud]
    setFormData((prev) => ({
      ...prev,
      location: formatMapboxLabel(feature),
      lat,
      lng,
    }));
    setMapPosition([lat, lng]);
    setFlyTarget([lat, lng]);
    setLocationQuery('');
    setSuggestions([]);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'ar',
        types: 'address,poi',
        language: 'es',
        limit: '1',
      });
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = (await res.json()) as MapboxGeocodingResponse;
      const feature = data.features?.[0];
      if (feature) {
        const label = formatMapboxLabel(feature);
        if (label) {
          setFormData((prev) => ({ ...prev, location: label }));
        }
      }
    } catch {
      // Silencioso: la geocodificación inversa no debe bloquear la selección
    }
  };

  const openMap = () => {
    const pos: [number, number] = [currentLat, currentLng];
    setMapPosition(pos);
    setFlyTarget(pos);
    setSuggestions([]);
    setIsMapOpen(true);
  };

  const centerOnUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        setMapPosition([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
      },
      () => alert('No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
    setMapPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const created = await spaceService.createSpace(formData);
        setSpaces((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        showToast('Espacio creado correctamente');
      } else if (modalMode === 'edit' && selectedSpace) {
        const updated = await spaceService.updateSpace(selectedSpace.id, formData);
        setSpaces((prev) =>
          prev
            .map((s) => (s.id === updated.id ? updated : s))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        showToast('Espacio actualizado correctamente');
      }
      setModalMode(null);
    } catch (err) {
      console.error(err);
      showToast('Error al guardar el espacio', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  };

  const handleDeleteSpace = async () => {
    if (!spaceToDelete) return;
    const spaceId = spaceToDelete.id;
    try {
      setDeleting(true);
      await spaceService.deleteSpace(spaceId);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      setSpaceToDelete(null);
      showToast('Espacio eliminado correctamente');
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar el espacio', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (space: Space) => {
    if (togglingId === space.id) return;
    const nextActive = !space.isActive;
    setTogglingId(space.id);
    setSpaces((prev) =>
      prev.map((s) => (s.id === space.id ? { ...s, isActive: nextActive } : s)),
    );
    try {
      await spaceService.updateSpace(space.id, {
        name: space.name,
        sportCategory: space.sportCategory,
        location: space.location,
        lat: space.lat,
        lng: space.lng,
        isActive: nextActive,
        allowReservations: space.allowReservations,
        permitir_superposicion: space.permitir_superposicion,
      });
      showToast(nextActive ? 'Espacio activado' : 'Espacio desactivado (mantenimiento)');
    } catch (err) {
      console.error(err);
      setSpaces((prev) =>
        prev.map((s) => (s.id === space.id ? { ...s, isActive: space.isActive } : s)),
      );
      showToast('No se pudo actualizar el estado del espacio', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">
          <p className="text-sm text-slate-400">Gestioná canchas/espacios y su configuración de reservas.</p>

          {/* Sección interactiva de ayuda y buenas prácticas */}
          <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold text-white">
                <span className="text-base">💡</span> Consejos y Recomendaciones de Configuración
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${helpOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {helpOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1 space-y-4 text-sm text-slate-300">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                      <p>
                        <strong className="text-white">Canchas Individuales:</strong> Se recomienda crear cada superficie
                        de juego como un espacio independiente.{' '}
                        <em className="text-slate-400">
                          Ejemplo: Si el club tiene 4 canchas de bochas, crea 4 espacios separados ("Bochas 1", "Bochas 2",
                          "Bochas 3" y "Bochas 4") para gestionar sus reservas de forma precisa y evitar sobreturnos.
                        </em>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                      <p>
                        <strong className="text-white">Espacios Comodín:</strong> Usa categorías como{' '}
                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 text-xs">"Espacio Cubierto"</code> o{' '}
                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 text-xs">"Espacio al Aire Libre"</code>{' '}
                        para actividades generales (entrenamientos físicos, preparación o eventos) que no ocupen una cancha específica.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                      <div>
                        <p className="mb-2"><strong className="text-white">Superposición de Horarios:</strong></p>
                        <ul className="space-y-2 pl-1">
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 font-bold">–</span>
                            <span>
                              <strong className="text-emerald-300">Deshabilitada (Recomendado):</strong> Evita que dos
                              actividades compartan espacio y hora. Los bloques ocupados se marcarán en{' '}
                              <strong className="text-red-400">ROJO</strong>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">–</span>
                            <span>
                              <strong className="text-amber-300">Habilitada:</strong> Permite que actividades del{' '}
                              <strong>mismo deporte</strong> compartan el espacio (se advertirá en{' '}
                              <strong className="text-amber-400">AMARILLO</strong>).{' '}
                              <em className="text-slate-400">Nota: Por seguridad, deportes distintos nunca se pueden superponer.</em>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                    <h3 className="font-bold text-white truncate">{s.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {s.sportCategory} • {s.location}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.allowReservations
                        ? 'Permite reservas'
                        : 'Bloqueo de Alquileres Privados'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-center justify-center gap-1.5 w-40 shrink-0">
                      <span className={`flex items-center gap-1 text-[11px] font-bold whitespace-nowrap transition-all duration-300 ease-in-out ${s.isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {s.isActive ? (
                          <><CheckCircle2 size={12} /> Activo</>
                        ) : (
                          <><Wrench size={12} /> En Mantenimiento</>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        disabled={togglingId === s.id}
                        aria-label={s.isActive ? 'Desactivar espacio' : 'Activar espacio'}
                        title={s.isActive ? 'Desactivar (mantenimiento)' : 'Activar espacio'}
                        className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ease-in-out shrink-0 ${s.isActive ? 'bg-emerald-500' : 'bg-amber-500'} disabled:opacity-50 disabled:cursor-wait`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out ${s.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">

                    <button 
                      onClick={() => handleOpenModal('edit', s)}
                      className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 border border-slate-700" title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setSpaceToDelete(s)}
                      className="p-2 bg-red-900/20 text-red-400 rounded-md hover:bg-red-900/40 border border-red-900/20"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            name="location"
                            required
                            value={formData.location}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData({ ...formData, location: value });
                              setLocationQuery(value);
                              if (value.trim().length < 3) {
                                setSuggestions([]);
                              }
                            }}
                            className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                            placeholder="Buscar dirección..."
                          />
                          {suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-slate-800">
                              {suggestions.map((feature, idx) => (
                                <button
                                  key={`${feature.id}-${idx}`}
                                  type="button"
                                  onClick={() => selectLocationSuggestion(feature)}
                                  className="w-full text-left px-3 py-2.5 text-sm text-slate-100 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors border-b border-slate-800 last:border-0"
                                >
                                  <MapPin size={14} className="inline mr-2 text-emerald-400" />
                                  {formatMapboxLabel(feature)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={openMap}
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

                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-1">
                      <Toggle
                        label="Permitir superposición de horarios"
                        checked={formData.permitir_superposicion}
                        onChange={(val) => setFormData({...formData, permitir_superposicion: val})}
                      />
                      <p className="text-[11px] text-slate-500 -mt-1 pb-2">
                        Permite que dos actividades del mismo deporte compartan espacio y horario.
                      </p>
                    </div>

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
                  <MapContainer
                    center={mapPosition}
                    zoom={15}
                    scrollWheelZoom
                    style={{ width: '100%', height: '100%' }}
                    className="bg-slate-900"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={mapPosition}
                      draggable
                      icon={locationIcon}
                      eventHandlers={{
                        dragend: (e) => {
                          const { lat, lng } = e.target.getLatLng();
                          setFormData((prev) => ({ ...prev, lat, lng }));
                          setMapPosition([lat, lng]);
                        },
                      }}
                    />
                    <MapClickHandler onClick={handleMapClick} />
                    <MapFlyTo position={flyTarget} />
                  </MapContainer>
                </div>
                <div className="p-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={centerOnUserLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    <LocateFixed size={16} /> Mi ubicación
                  </button>
                  <div className="flex items-center gap-2">
                    {buildNavigationLinks(currentLat, currentLng).map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                      >
                        <ExternalLink size={14} /> {link.label}
                      </a>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(false)}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-600"
                  >
                    Confirmar Ubicación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación de borrado */}
          <AnimatePresence>
            {spaceToDelete && (
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
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                      <Trash2 size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">¿Eliminar espacio?</h3>
                      <p className="text-sm text-slate-400 mt-2">
                        ¿Estás seguro de que deseas eliminar el espacio '{spaceToDelete.name}'? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setSpaceToDelete(null)}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSpace}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Toast de confirmación */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red-400 shrink-0" />
              )}{' '}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



