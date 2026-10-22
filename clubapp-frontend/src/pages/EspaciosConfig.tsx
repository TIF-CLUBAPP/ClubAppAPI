import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Save, ChevronDown, MapPin, LocateFixed, ExternalLink, CheckCircle2, Wrench, Lightbulb } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Space, SaveSpaceRequest, ModalMode } from '../types/space';
import { SPORT_CATEGORIES, shouldDisableReservationsByDefault } from '../types/space';
import { spaceService } from '../services/spaceService';
import { buildNavigationLinks } from '../utils/navigation';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';

// Limpia ceros a la izquierda en inputs numéricos (ej. "046456" -> "46456").
const parseNumericInput = (raw: string): number => {
  const cleaned = raw.replace(/^0+(?=\d)/, '');
  return cleaned === '' ? 0 : Number(cleaned);
};

// Define local defaultRequest since it's no longer exported
const getNewSpaceData = (): SaveSpaceRequest => ({
  name: '',
  sportCategory: '',
  location: '',
  lat: -34.6037, // Default to Buenos Aires
  lng: -58.3816,
  isActive: true,
  allowReservations: true,
  requiresApproval: false,
  permitir_superposicion: false,
  pricePerHour: 0,
  canonBase: 0,
  aplicaDescuentoSocios: false,
  tipoDescuentoCanon: 'MONTO_FIJO',
  valorDescuentoPorSocio: 0,
  descuentoMaximoCanon: null,
  slotDurationMinutes: 60,
  is24Hours: false,
  openTime: '08:00',
  closeTime: '23:00',
});

const Toggle = ({ checked, onChange, label, description }: { checked: boolean, onChange: (val: boolean) => void, label: string, description?: string }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <span className="text-sm text-slate-400">{label}</span>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5 leading-5">{description}</p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 transition-all duration-200 shrink-0 ${checked ? 'bg-emerald-500' : 'bg-slate-700/80'}`}
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

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
}

const SpacesHelpModal = ({ isOpen, onClose, dontShowAgain, setDontShowAgain }: HelpModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-60">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="sm:hidden w-10 h-1.5 rounded-full bg-slate-700 mx-auto mt-3" aria-hidden="true" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">💡</div>
              <div>
                <h3 className="text-lg font-bold text-white">Guía de Configuración de Espacios</h3>
                <p className="text-xs text-slate-400">Recomendaciones para organizar tus instalaciones</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400 font-bold">•</span>
              <p><strong className="text-white">Canchas Individuales:</strong> Crea cada superficie de juego como un espacio independiente (ej. "Bochas 1", "Bochas 2") para gestionar reservas precisas y evitar sobreturnos.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400 font-bold">•</span>
              <p><strong className="text-white">Espacios Comodín:</strong> Usa categorías como <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 text-xs">"Espacio Cubierto"</code> o <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 text-xs">"Espacio al Aire Libre"</code> para entrenamientos generales o eventos.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400 font-bold">•</span>
              <p><strong className="text-white">Espacios Compartidos:</strong> Si deportes distintos usan la misma instalación física (ej. Hockey y Fútbol), no dupliques el espacio. Selecciona el existente al crear la actividad.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400 font-bold">•</span>
              <div>
                <p className="mb-2"><strong className="text-white">Superposición de Horarios:</strong></p>
                <ul className="space-y-2 pl-1 text-xs">
                  <li>• <strong className="text-emerald-300">Deshabilitada (Recomendado):</strong> Evita cruces. Los bloques ocupados se marcan en <strong className="text-red-400">ROJO</strong>.</li>
                  <li>• <strong className="text-amber-300">Habilitada:</strong> Permite que actividades del mismo deporte compartan espacio (aviso en <strong className="text-amber-400">AMARILLO</strong>).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
              <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500" />
              No volver a mostrar automáticamente
            </label>
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all">
              ¡Entendido, comenzar!
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


export default function EspaciosConfig() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<SaveSpaceRequest>(getNewSpaceData());

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([-34.6037, -58.3816]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenSpacesGuide');
    if (hasSeen !== 'true') {
      setIsHelpModalOpen(true);
    }
  }, []);

  const handleCloseHelpModal = () => {
    if (dontShowAgain) {
      localStorage.setItem('hasSeenSpacesGuide', 'true');
    }
    setIsHelpModalOpen(false);
  };

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
        requiresApproval: space.requiresApproval,
        permitir_superposicion: space.permitir_superposicion,
        pricePerHour: space.pricePerHour,
        canonBase: space.canonBase,
        aplicaDescuentoSocios: space.aplicaDescuentoSocios,
        tipoDescuentoCanon: space.tipoDescuentoCanon,
        valorDescuentoPorSocio: space.valorDescuentoPorSocio,
        descuentoMaximoCanon: space.descuentoMaximoCanon,
        slotDurationMinutes: space.slotDurationMinutes,
        is24Hours: space.is24Hours,
        openTime: space.openTime ?? '08:00',
        closeTime: space.closeTime ?? '23:00',
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
      toast.error('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        setMapPosition([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
      },
      () => toast.error('No se pudo obtener tu ubicación.'),
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
        toast.success('Espacio creado correctamente');
      } else if (modalMode === 'edit' && selectedSpace) {
        const updated = await spaceService.updateSpace(selectedSpace.id, formData);
        setSpaces((prev) =>
          prev
            .map((s) => (s.id === updated.id ? updated : s))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success('Espacio actualizado correctamente');
      }
      setModalMode(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el espacio');
    }
  };

  const handleDeleteSpace = async () => {
    if (!spaceToDelete) return;
    const spaceId = spaceToDelete.id;
    try {
      setDeleting(true);
      await spaceService.deleteSpace(spaceId);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      setSpaceToDelete(null);
      toast.success('Espacio eliminado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el espacio');
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
        requiresApproval: space.requiresApproval,
        permitir_superposicion: space.permitir_superposicion,
        pricePerHour: space.pricePerHour,
        canonBase: space.canonBase,
        aplicaDescuentoSocios: space.aplicaDescuentoSocios,
        tipoDescuentoCanon: space.tipoDescuentoCanon,
        valorDescuentoPorSocio: space.valorDescuentoPorSocio,
        descuentoMaximoCanon: space.descuentoMaximoCanon,
        slotDurationMinutes: space.slotDurationMinutes,
        is24Hours: space.is24Hours,
        openTime: space.openTime ?? '08:00',
        closeTime: space.closeTime ?? '23:00',
      });
      toast.success(nextActive ? 'Espacio activado' : 'Espacio desactivado (mantenimiento)');
    } catch (err) {
      console.error(err);
      setSpaces((prev) =>
        prev.map((s) => (s.id === space.id ? { ...s, isActive: space.isActive } : s)),
      );
      toast.error('No se pudo actualizar el estado del espacio');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        <Header />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Espacios y Canchas</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gestioná canchas y configuración de reservas</p>
          </div>

          {/* Banner de Consejos Rediseñado (Compacto & Minimalista) */}
          <div className="mb-6">
            <div
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-sm cursor-pointer hover:bg-slate-900/80 transition-all group shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Lightbulb size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    ¿Cómo configurar espacios?
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Buenas prácticas para crear canchas, espacios comodín y evitar solapamientos.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                Ver Guía
              </span>
            </div>
          </div>

          <SpacesHelpModal
            isOpen={isHelpModalOpen}
            onClose={handleCloseHelpModal}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />

          <div className="flex items-center justify-between gap-3 my-4">
            {loading ? (
              <div />
            ) : (
              <div className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Activos: {spaces.filter(s => s.isActive).length}/{spaces.length}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleOpenModal('create')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} /> Nuevo Espacio
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
                  className="bg-slate-900 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate text-base">{s.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {s.sportCategory} • {s.location}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.allowReservations
                        ? 'Permite reservas'
                        : 'Bloqueo de Alquileres Privados'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
                    <div className="flex flex-col items-start md:items-center justify-center gap-1.5 w-full sm:w-40 shrink-0">
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
                    <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
                      <button 
                        onClick={() => handleOpenModal('edit', s)}
                        className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 text-slate-200" title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setSpaceToDelete(s)}
                        className="p-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/40 border border-red-900/20"
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
                  className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                    <h3 className="text-lg font-bold">{modalMode === 'create' ? 'Nuevo Espacio' : 'Editar Espacio'}</h3>
                    <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <form id="space-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-4 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <span className={formData.sportCategory ? '' : 'text-slate-500'}>
                              {formData.sportCategory || 'Seleccioná un deporte...'}
                            </span>
                            <ChevronDown size={16} className="shrink-0" />
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
                      onChange={(val) => setFormData({...formData, allowReservations: val, requiresApproval: val ? formData.requiresApproval : false})}
                    />

                    <AnimatePresence initial={false}>
                      {formData.allowReservations && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 space-y-4">
                            <Toggle
                              label="Requiere Aprobación Manual"
                              description="Las reservas quedarán pendientes de confirmación por un administrador."
                              checked={formData.requiresApproval}
                              onChange={(val) => setFormData({...formData, requiresApproval: val})}
                            />

                            <div className="border-t border-slate-800 pt-3">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Configuración de Alquiler</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Precio por Hora ($)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.pricePerHour === 0 ? '' : formData.pricePerHour}
                                  onChange={(e) => setFormData({...formData, pricePerHour: parseNumericInput(e.target.value)})}
                                  className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Duración del Turno</label>
                                <select
                                  value={formData.slotDurationMinutes}
                                  onChange={(e) => setFormData({...formData, slotDurationMinutes: Number(e.target.value)})}
                                  className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                >
                                  <option value={30}>30 min</option>
                                  <option value={45}>45 min</option>
                                  <option value={60}>60 min</option>
                                  <option value={90}>90 min</option>
                                  <option value={120}>120 min</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="block text-xs font-bold text-slate-400 mb-1">Canon Base de Instalaciones ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.canonBase === 0 ? '' : formData.canonBase}
                                onChange={(e) => setFormData({...formData, canonBase: parseNumericInput(e.target.value)})}
                                className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                Se precompleta como canon por defecto en las actividades de profesores independientes.
                              </p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                              <Toggle
                                label="Descuento por Volumen de Socios"
                                description="Aplica un descuento en el canon por cada alumno que sea socio activo."
                                checked={formData.aplicaDescuentoSocios}
                                onChange={(val) => setFormData({...formData, aplicaDescuentoSocios: val})}
                              />

                              {formData.aplicaDescuentoSocios && (
                                <div className="space-y-3 pl-2 border-l-2 border-emerald-500/30">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Tipo de Descuento</label>
                                    <select
                                      value={formData.tipoDescuentoCanon}
                                      onChange={(e) => setFormData({...formData, tipoDescuentoCanon: e.target.value as 'MONTO_FIJO' | 'PORCENTAJE'})}
                                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                    >
                                      <option value="MONTO_FIJO">Monto Fijo ($ por socio)</option>
                                      <option value="PORCENTAJE">Porcentaje (% del canon por socio)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">
                                      {formData.tipoDescuentoCanon === 'PORCENTAJE' ? 'Porcentaje de Descuento por Socio (%)' : 'Monto de Descuento por Socio ($)'}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formData.valorDescuentoPorSocio === 0 ? '' : formData.valorDescuentoPorSocio}
                                      onChange={(e) => setFormData({...formData, valorDescuentoPorSocio: parseNumericInput(e.target.value)})}
                                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Descuento Máximo Total ($ o vacío)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formData.descuentoMaximoCanon == null ? '' : formData.descuentoMaximoCanon}
                                      onChange={(e) => setFormData({...formData, descuentoMaximoCanon: e.target.value === '' ? null : parseNumericInput(e.target.value)})}
                                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <Toggle
                              label="Abierto 24 Horas"
                              description="Ignora el rango horario y permite reservar a cualquier hora del día."
                              checked={formData.is24Hours}
                              onChange={(val) => setFormData({...formData, is24Hours: val})}
                            />

                            {!formData.is24Hours && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1">Hora de Apertura</label>
                                  <input
                                    type="time"
                                    value={formData.openTime ?? '08:00'}
                                    onChange={(e) => setFormData({...formData, openTime: e.target.value})}
                                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1">Hora de Cierre</label>
                                  <input
                                    type="time"
                                    value={formData.closeTime ?? '23:00'}
                                    onChange={(e) => setFormData({...formData, closeTime: e.target.value})}
                                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

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

                  </form>

                  <div className="p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 shrink-0 flex flex-row gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setModalMode(null)}
                      className="flex-1 py-3 px-4 font-medium rounded-xl text-sm transition-all border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="space-form"
                      className="flex-1 py-3 px-4 rounded-xl text-sm transition-all bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-500/20"
                    >
                      <Save size={16} className="shrink-0" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
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

      </div>
    </div>
  );
}



