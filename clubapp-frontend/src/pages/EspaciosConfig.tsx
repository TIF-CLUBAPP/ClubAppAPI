import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { spaceService } from '../services/spaceService';
import type { Space } from '../types/space';


type ModalMode = 'create' | 'edit';

type SaveSpaceRequest = {
  name: string;
  sportCategory: string;
  location: string;
  allowReservationsDuringClasses: boolean;
  isActive: boolean;
};

const SPORT_CATEGORIES = [
  'Fútbol',
  'Tenis',
  'Pádel',
  'Básquet',
  'Gym',
  'Pileta',
];

const defaultRequest = (): SaveSpaceRequest => ({
  name: '',
  sportCategory: SPORT_CATEGORIES[0],
  location: '',
  isActive: true,
  allowReservationsDuringClasses: false,
});

export default function EspaciosConfig() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

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
              onClick={() => setModalMode('create')}
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
                      {s.allowReservationsDuringClasses
                        ? 'Permite reservas durante clases'
                        : 'Bloquea reservas durante clases'}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 border border-slate-700" title="Editar">
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

          {/* TODO: Modal CRUD */}
        </main>
      </div>
    </div>
  );
}
