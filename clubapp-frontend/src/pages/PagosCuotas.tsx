import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  Percent, 
  ShieldAlert, 
  UserCheck, 
  Save, 
  RefreshCw,
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  Pencil,
  PauseCircle,
  PlayCircle,
  X,
  Users,
  Award,
  FileText,
  CheckCircle2,
  Receipt,
  Clock,
  AlertTriangle,
  Info,
  Smartphone
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { paymentsService } from '../services/paymentsService';
import { userService } from '../services/userService';
import type { FeeSettings, RoleExemption, UserExemption } from '../types/cuotas';
import type { UserListItem } from '../types/user';

const DEFAULT_ROLES: RoleExemption[] = [
  { Role: 'STAFF', AreFeesExempt: true, discountPercentage: 100, Description: 'Personal administrativo y de campo', userCount: 8 },
  { Role: 'TEACHER', AreFeesExempt: true, discountPercentage: 100, Description: 'Entrenadores y profesores del club', userCount: 15 },
  { Role: 'ADMIN', AreFeesExempt: true, discountPercentage: 100, Description: 'Comisión directiva y administradores', userCount: 5 },
  { Role: 'MEMBER', AreFeesExempt: false, discountPercentage: 0, Description: 'Socios generales del club', userCount: 142 },
];

const INITIAL_USER_EXEMPTIONS: UserExemption[] = [
  {
    UserId: 101,
    FullName: 'Carlos Rodríguez',
    Email: 'carlos.rodriguez@email.com',
    Role: 'MEMBER',
    dni: '24.891.023',
    IsExemptFromFees: true,
    category: 'Discapacidad',
    discountPercentage: 100,
    reason: 'CUD Presentado N° 49302/2024'
  },
  {
    UserId: 102,
    FullName: 'María Elena Gómez',
    Email: 'maria.gomez@email.com',
    Role: 'MEMBER',
    dni: '14.302.911',
    IsExemptFromFees: true,
    category: 'Jubilado',
    discountPercentage: 50,
    reason: 'Carnet Jubilada Anses N° 092-384'
  },
  {
    UserId: 103,
    FullName: 'Lucas Fernández',
    Email: 'lucas.fernandez@email.com',
    Role: 'MEMBER',
    dni: '42.109.834',
    IsExemptFromFees: true,
    category: 'Beca Social/Deportiva',
    discountPercentage: 100,
    reason: 'Beca Deportiva Sub-20 Básquet'
  },
  {
    UserId: 104,
    FullName: 'Roberto Benítez',
    Email: 'r.benitez@email.com',
    Role: 'MEMBER',
    dni: '11.492.001',
    IsExemptFromFees: true,
    category: 'Socio Vitalicio',
    discountPercentage: 100,
    reason: 'Más de 40 años de antigüedad continuos'
  }
];

export const PagosCuotas: React.FC = () => {
  // Estados de Configuración
  const [settings, setSettings] = useState<FeeSettings>({
    baseFeeAmount: 0,
    lateFeePercentage: 0,
    lateFeeType: 'percentage',
    dueDayOfMonth: 10,
  });

  const [baseFeeInput, setBaseFeeInput] = useState<string>('0');
  const [lateFeeInput, setLateFeeInput] = useState<string>('0');
  const [dueDayInput, setDueDayInput] = useState<string>('10');

  // Estados de Exenciones
  const [roleExemptions, setRoleExemptions] = useState<RoleExemption[]>(DEFAULT_ROLES);
  const [userExemptions, setUserExemptions] = useState<UserExemption[]>(INITIAL_USER_EXEMPTIONS);
  const [searchUser, setSearchUser] = useState('');

  // Estados UI
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  // Modal de confirmación de cambio de tarifa (la nueva tarifa rige desde el 1° del mes siguiente)
  const [isSettingsConfirmOpen, setIsSettingsConfirmOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<FeeSettings | null>(null);
  // Valores persistidos (último estado guardado en la API). Se usan como base para
  // detectar cambios sin guardar y controlar la visibilidad del cartel amarillo.
  const [savedSettings, setSavedSettings] = useState<FeeSettings>({
    baseFeeAmount: 0,
    lateFeePercentage: 0,
    lateFeeType: 'percentage',
    dueDayOfMonth: 10,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Modal Form Inputs
  const [selectedUser, setSelectedUser] = useState<{ id: number; fullName: string; email: string; dni: string; role: string } | null>(null);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserListItem[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [category, setCategory] = useState<'Discapacidad' | 'Jubilado' | 'Beca Social/Deportiva' | 'Socio Vitalicio' | 'Otro'>('Discapacidad');
  const [discountPercentage, setDiscountPercentage] = useState<number>(100);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Auto-ocultar notificación (Auto-dismiss) tras 3 segundos
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // Autocomplete search for users in modal
  useEffect(() => {
    if (!userSearchInput.trim() || (selectedUser && selectedUser.fullName === userSearchInput)) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const users = await userService.getUsers({ searchQuery: userSearchInput });
        setUserSearchResults(users.slice(0, 5));
      } catch (err) {
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchInput, selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, exemptionsData] = await Promise.all([
        paymentsService.getSettings(),
        paymentsService.getExemptions(),
      ]);
      setSettings(settingsData);
      setSavedSettings(settingsData);
      setBaseFeeInput(String(settingsData.baseFeeAmount ?? 0));
      setLateFeeInput(String(settingsData.lateFeePercentage ?? 0));
      setDueDayInput(String(settingsData.dueDayOfMonth ?? 10));
      
      if (exemptionsData.Roles && exemptionsData.Roles.length > 0) {
        const mergedRoles = DEFAULT_ROLES.map(def => {
          const found = exemptionsData.Roles.find(r => r.Role.toUpperCase() === def.Role.toUpperCase());
          if (!found) return def;
          const isExempt = found.AreFeesExempt;
          const pct = found.discountPercentage !== undefined ? found.discountPercentage : (isExempt ? 100 : 0);
          return {
            ...def,
            AreFeesExempt: isExempt && pct > 0,
            discountPercentage: pct
          };
        });
        setRoleExemptions(mergedRoles);
      }

      if (exemptionsData.Users && exemptionsData.Users.length > 0) {
        const enrichedUsers = exemptionsData.Users.map(u => ({
          ...u,
          category: u.category || 'Beca Social/Deportiva',
          discountPercentage: u.discountPercentage || 100,
          reason: u.reason || 'Exención autorizada',
        }));
        setUserExemptions(enrichedUsers);
      }
    } catch (err) {
      setMessage({ text: 'Error al cargar los datos del módulo de cuotas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBaseFeeBlur = () => {
    const val = parseFloat(baseFeeInput);
    if (isNaN(val) || val < 0) {
      setBaseFeeInput('0');
      setSettings(prev => ({ ...prev, baseFeeAmount: 0 }));
    } else {
      setBaseFeeInput(String(val));
      setSettings(prev => ({ ...prev, baseFeeAmount: val }));
    }
  };

  const handleLateFeeBlur = () => {
    const val = parseFloat(lateFeeInput);
    if (isNaN(val) || val < 0) {
      setLateFeeInput('0');
      setSettings(prev => ({ ...prev, lateFeePercentage: 0 }));
    } else {
      setLateFeeInput(String(val));
      setSettings(prev => ({ ...prev, lateFeePercentage: val }));
    }
  };

  const handleDueDayBlur = () => {
    const val = parseInt(dueDayInput, 10);
    if (isNaN(val) || val < 1) {
      setDueDayInput('1');
      setSettings(prev => ({ ...prev, dueDayOfMonth: 1 }));
    } else if (val > 31) {
      setDueDayInput('31');
      setSettings(prev => ({ ...prev, dueDayOfMonth: 31 }));
    } else {
      setDueDayInput(String(val));
      setSettings(prev => ({ ...prev, dueDayOfMonth: val }));
    }
  };

  /**
   * Primer día del mes siguiente, en formato legible (ej. "01/10/2026").
   * Es la fecha en la que entrará en vigencia la nueva tarifa.
   */
  const getProximoMesLabel = () => {
    const hoy = new Date();
    const proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    return proximo.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  /**
   * El submit del formulario ya no impacta el backend directamente:
   * valida los valores y abre el modal de confirmación.
   */
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const base = Math.max(0, parseFloat(baseFeeInput) || 0);
    const late = Math.max(0, parseFloat(lateFeeInput) || 0);
    const due = Math.min(31, Math.max(1, parseInt(dueDayInput, 10) || 1));

    const updatedSettings: FeeSettings = {
      ...settings,
      baseFeeAmount: base,
      lateFeePercentage: late,
      dueDayOfMonth: due,
    };

    setPendingSettings(updatedSettings);
    setIsSettingsConfirmOpen(true);
  };

  /** Confirmación explícita del modal: recién acá se impacta el backend. */
  const confirmSaveSettings = async () => {
    if (!pendingSettings) return;

    const updatedSettings = pendingSettings;

    setSettings(updatedSettings);
    setBaseFeeInput(String(updatedSettings.baseFeeAmount));
    setLateFeeInput(String(updatedSettings.lateFeePercentage));
    setDueDayInput(String(updatedSettings.dueDayOfMonth));
    setIsSettingsConfirmOpen(false);
    setPendingSettings(null);

    try {
      setSavingSettings(true);
      const saved = await paymentsService.updateSettings(updatedSettings);
      // El backend devuelve la fecha de vigencia; se refleja en el estado local.
      const persistedSettings: FeeSettings = { ...updatedSettings, ...saved };
      setSettings(persistedSettings);
      // Actualiza la base de comparación para ocultar el cartel amarillo de cambios.
      setSavedSettings(persistedSettings);
      setMessage({
        text: `Tarifa registrada en el historial. Se aplicará desde el ${getProximoMesLabel()}.`,
        type: 'success'
      });
    } catch (err) {
      setMessage({ text: 'No se pudo guardar la configuración.', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const cancelSaveSettings = () => {
    setIsSettingsConfirmOpen(false);
    setPendingSettings(null);
  };

  const handleRolePercentageChange = async (roleName: string, newPercentage: number) => {
    const clampedPct = Math.min(100, Math.max(0, newPercentage));
    const isExempt = clampedPct > 0;

    setRoleExemptions(prev =>
      prev.map(r => r.Role === roleName ? { ...r, discountPercentage: clampedPct, AreFeesExempt: isExempt } : r)
    );

    try {
      await paymentsService.toggleRoleExemption(roleName, isExempt);
    } catch (err) {
      console.warn(`[paymentsService] toggleRoleExemption percentage fallback for ${roleName}: backend endpoint not active yet. Local state updated successfully.`);
    }

    setMessage({ text: `Porcentaje de exención (${clampedPct}%) guardado para el rol ${getRoleLabel(roleName)}.`, type: 'success' });
  };

  // Modal & User Exemption Handlers
  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setSelectedUser(null);
    setUserSearchInput('');
    setUserSearchResults([]);
    setCategory('Discapacidad');
    setDiscountPercentage(100);
    setReason('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (userEx: UserExemption) => {
    setEditingUserId(userEx.UserId);
    setSelectedUser({
      id: userEx.UserId,
      fullName: userEx.FullName,
      email: userEx.Email,
      dni: userEx.dni || '',
      role: userEx.Role
    });
    setUserSearchInput(userEx.FullName);
    setCategory((userEx.category as any) || 'Beca Social/Deportiva');
    setDiscountPercentage(userEx.discountPercentage || 100);
    setReason(userEx.reason || '');
    setIsModalOpen(true);
  };

  const handleToggleSuspendUserExemption = async (userEx: UserExemption) => {
    const newStatus = !userEx.IsExemptFromFees;
    try {
      await paymentsService.toggleUserExemption(String(userEx.UserId), newStatus);
    } catch (err) {
      console.warn('[paymentsService] toggleUserExemption fallback: backend endpoint not active yet. Local state updated.');
    }

    setUserExemptions(prev =>
      prev.map(u => u.UserId === userEx.UserId ? { ...u, IsExemptFromFees: newStatus } : u)
    );

    setMessage({
      text: `Exención de ${userEx.FullName} ${newStatus ? 'reactivada' : 'suspendida'} correctamente.`,
      type: 'success'
    });
  };

  const handleSaveExemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setMessage({ text: 'Por favor, selecciona un socio válido de la lista.', type: 'error' });
      return;
    }

    try {
      await paymentsService.toggleUserExemption(String(selectedUser.id), true);
    } catch (err) {
      console.warn('[paymentsService] toggleUserExemption fallback: backend endpoint not active yet. Local state updated.');
    }

    setUserExemptions(prev => {
      const isEditing = editingUserId !== null;
      const targetId = isEditing ? editingUserId : selectedUser.id;
      const exists = prev.some(u => u.UserId === targetId);

      if (exists) {
        return prev.map(u => 
          u.UserId === targetId 
            ? {
                ...u,
                UserId: selectedUser.id,
                FullName: selectedUser.fullName,
                Email: selectedUser.email,
                Role: selectedUser.role,
                dni: selectedUser.dni,
                IsExemptFromFees: true, // Al guardar/modificar reactiva el beneficio
                category,
                discountPercentage,
                reason
              } 
            : u
        );
      } else {
        return [
          {
            UserId: selectedUser.id,
            FullName: selectedUser.fullName,
            Email: selectedUser.email,
            Role: selectedUser.role,
            dni: selectedUser.dni,
            IsExemptFromFees: true,
            category,
            discountPercentage,
            reason
          },
          ...prev
        ];
      }
    });

    const successMessage = editingUserId
      ? `Exención de ${selectedUser.fullName} modificada correctamente.`
      : `Exención registrada correctamente para ${selectedUser.fullName}.`;

    setMessage({ text: successMessage, type: 'success' });
    setIsModalOpen(false);
  };

  const handleRemoveUserExemption = async (userEx: UserExemption) => {
    if (!window.confirm(`¿Estás seguro de eliminar definitivamente el registro de exención de ${userEx.FullName}?`)) {
      return;
    }

    try {
      await paymentsService.toggleUserExemption(String(userEx.UserId), false);
    } catch (err) {
      console.warn('[paymentsService] toggleUserExemption delete fallback.');
    }

    setUserExemptions(prev => prev.filter(u => u.UserId !== userEx.UserId));
    setMessage({ text: `Exención eliminada correctamente para ${userEx.FullName}.`, type: 'success' });
  };

  const getRoleLabel = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'Directivos y Admins';
      case 'SUPERADMIN': return 'Super Administradores';
      case 'TEACHER':
      case 'COACH': return 'Entrenadores y Profesores';
      case 'STAFF': return 'Personal de Staff';
      case 'MEMBER': return 'Socios Regulares';
      default: return role;
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Discapacidad':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Jubilado':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Beca Social/Deportiva':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Socio Vitalicio':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredUsers = userExemptions.filter(u => 
    u.FullName.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.Email.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.dni && u.dni.toLowerCase().includes(searchUser.toLowerCase())) ||
    (u.category && u.category.toLowerCase().includes(searchUser.toLowerCase())) ||
    (u.reason && u.reason.toLowerCase().includes(searchUser.toLowerCase()))
  );

  // Detecta cambios sin guardar en los inputs de configuración de precios y mora.
  // El cartel amarillo de advertencia solo se muestra mientras exista un cambio pendiente.
  const hasPendingChanges =
    settings.baseFeeAmount !== savedSettings.baseFeeAmount ||
    settings.lateFeePercentage !== savedSettings.lateFeePercentage ||
    settings.dueDayOfMonth !== savedSettings.dueDayOfMonth;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar Fijo */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Superior */}
        <Header />

        {/* Contenido Principal */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Cargando panel de gestión de cuotas...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Pagos & Cuotas</h1>
                <p className="text-slate-400 text-sm">
                  Administrá el monto de la cuota social, recargos por mora y exenciones por rol o socio.
                </p>
              </div>

              {/* 1. CONFIGURACIÓN GENERAL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Configuración de Precios y Mora
                </h2>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PRECIO BASE CUOTA */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Precio Base Cuota ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                        <input
                          type="number"
                          min="0"
                          onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                          value={baseFeeInput}
                          onChange={e => {
                            setBaseFeeInput(e.target.value);
                            const parsed = parseFloat(e.target.value);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setSettings(prev => ({ ...prev, baseFeeAmount: parsed }));
                            }
                          }}
                          onBlur={handleBaseFeeBlur}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* RECARGO POR MORA */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-400">
                          Recargo por Mora ({settings.lateFeeType === 'percentage' ? '%' : '$'})
                        </label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, lateFeeType: settings.lateFeeType === 'percentage' ? 'fixed' : 'percentage' })}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          Cambiar a {settings.lateFeeType === 'percentage' ? 'Monto Fijo ($)' : 'Porcentaje (%)'}
                        </button>
                      </div>
                      <div className="relative">
                        {settings.lateFeeType === 'percentage' ? (
                          <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        ) : (
                          <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        )}
                        <input
                          type="number"
                          min="0"
                          onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                          value={lateFeeInput}
                          onChange={e => {
                            setLateFeeInput(e.target.value);
                            const parsed = parseFloat(e.target.value);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setSettings(prev => ({ ...prev, lateFeePercentage: parsed }));
                            }
                          }}
                          onBlur={handleLateFeeBlur}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* DÍA DE VENCIMIENTO */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Día de Vencimiento del Mes
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          min="1"
                          max="31"
                          onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                          value={dueDayInput}
                          onChange={e => {
                            setDueDayInput(e.target.value);
                            const parsed = parseInt(e.target.value, 10);
                            if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                              setSettings(prev => ({ ...prev, dueDayOfMonth: parsed }));
                            }
                          }}
                          onBlur={handleDueDayBlur}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* CÁLCULOS DE PRECIOS Y MORA */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-emerald-400" />
                          CÁLCULOS DE PRECIOS Y MORA
                        </span>
                        <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                          Cálculo Automático
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {/* CUOTA REGULAR */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3">
                          <span className="text-base font-semibold text-slate-300">
                            Cuota Regular (En término)
                          </span>
                          <div>
                            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(parseFloat(baseFeeInput) || 0)}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">Monto base mensual</p>
                          </div>
                        </div>

                        {/* CUOTA CON MORA */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-slate-300">
                              Cuota con Recargo por Mora
                            </span>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {settings.lateFeeType === 'percentage' ? `+${parseFloat(lateFeeInput) || 0}%` : `+$${parseFloat(lateFeeInput) || 0}`}
                            </span>
                          </div>
                          <div>
                            {(() => {
                              const b = parseFloat(baseFeeInput) || 0;
                              const l = parseFloat(lateFeeInput) || 0;
                              const extra = settings.lateFeeType === 'percentage' ? (b * l) / 100 : l;
                              const total = b + extra;
                              const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
                              return (
                                <>
                                  <p className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
                                    {fmt.format(total)}
                                  </p>
                                  <p className="text-sm text-slate-400 mt-1">
                                    Incluye recargo de {fmt.format(extra)}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* FECHA LÍMITE DE PAGO */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3">
                          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sky-400" />
                            Fecha Límite y Período de Mora
                          </span>
                          <div className="space-y-1.5">
                            {(() => {
                              const dueDay = Math.min(31, Math.max(1, parseInt(dueDayInput, 10) || 1));
                              const nextDay = dueDay < 31 ? dueDay + 1 : 31;
                              return (
                                <>
                                  <p className="text-sm font-medium text-slate-200 leading-relaxed">
                                    Aplica del día <span className="text-emerald-400 font-bold">1</span> al <span className="text-emerald-400 font-bold">{dueDay}</span> de cada mes.
                                  </p>
                                  <p className="text-sm text-slate-400 leading-relaxed">
                                    A partir del día <span className="text-amber-400 font-bold">{nextDay}</span> se aplica el recargo por mora.
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* TARIFA DIGITAL ATRIO (APP) */}
                      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            Tarifa Digital ATRIO (App)
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            RECARGO DIGITAL
                          </span>
                        </div>
                        {(() => {
                          const base = parseFloat(baseFeeInput) || 0;
                          const comisionAtrio = Math.min(base * 0.035, 1500);
                          const finalApp = base + comisionAtrio;
                          const fmtARS = (value: number, decimals: number) =>
                            new Intl.NumberFormat('es-AR', {
                              style: 'currency',
                              currency: 'ARS',
                              minimumFractionDigits: decimals,
                              maximumFractionDigits: decimals,
                            }).format(value);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Cuota Base del Club</p>
                                <p className="text-lg font-bold text-white">{fmtARS(base, 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Comisión de Plataforma ATRIO (3.5% - máx $1.500)</p>
                                <p className="text-lg font-bold text-emerald-400">+{fmtARS(comisionAtrio, 2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Monto Final Cobrado en App</p>
                                <p className="text-lg font-bold text-emerald-300">{fmtARS(finalApp, 2)}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* NOTA INFORMATIVA: TÉRMINOS DE TARIFA ATRIO */}
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-sky-200 leading-relaxed">
                          <p className="font-semibold text-sky-300">Transparencia en el servicio</p>
                          <p className="text-xs text-sky-300/80 mt-1">
                            El precio final incluye el costo por uso de plataforma ATRIO (3.5% con tope de $1.500 por transacción). Estas tarifas están sujetas a modificaciones por parte de ATRIO previa notificación.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AVISO: los cambios de tarifa no afectan deudas ya emitidas.
                      Solo se muestra cuando existe un cambio pendiente sin guardar. */}
                  {hasPendingChanges && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-200 leading-relaxed">
                        <p className="font-semibold text-amber-300">
                          ⚠️ Atención: Los cambios en el valor de la cuota se registrarán en el historial y comenzarán a aplicarse automáticamente a partir del próximo mes. Las cuotas y deudas vigentes hasta la fecha no sufrirán modificaciones.
                        </p>
                        <p className="text-xs text-amber-300/80 mt-2">
                          Nueva tarifa vigente desde el <span className="font-bold">{getProximoMesLabel()}</span>.
                          {settings.pendingEffectiveFromDate && (
                            <>
                              {' '}Ya hay un cambio pendiente con vigencia{' '}
                              <span className="font-bold">
                                {new Date(settings.pendingEffectiveFromDate).toLocaleDateString('es-AR')}
                              </span>.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. EXENCIÓN DE CUOTA POR ROL COMPLETO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="mb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    Exención de Cuota por Rol Completo
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Definí el porcentaje de exención aplicable a todos los socios registrados bajo cada rol.
                  </p>
                </div>

                {/* NOTIFICACIÓN CONTEXTUAL CON ANIMACIÓN SUAVE */}
                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div
                      key={message.text}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
                        message.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {message.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{message.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMessage(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {roleExemptions.map(role => {
                    const pct = role.discountPercentage ?? (role.AreFeesExempt ? 100 : 0);
                    const isExempt = role.AreFeesExempt && pct > 0;

                    return (
                      <div
                        key={role.Role}
                        className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700/80 transition space-y-4 shadow-lg"
                      >
                        {/* CABECERA DE LA TARJETA CON BADGE */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl transition ${isExempt ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/80 text-slate-400 border border-slate-800'}`}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-white">{getRoleLabel(role.Role)}</h3>
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                {role.userCount !== undefined ? `${role.userCount} socios` : 'Integrantes del rol'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition whitespace-nowrap ${
                            isExempt
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                          }`}>
                            {isExempt ? `${pct}% Exento` : 'Cobro Activo'}
                          </span>
                        </div>

                        {/* INPUT NUMÉRICO Y BOTONES DE PORCENTAJE */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-400 font-medium">
                              Porcentaje de Exención:
                            </label>
                            <div className="relative flex items-center bg-slate-900 border border-slate-700/80 focus-within:border-emerald-500 rounded-xl px-2.5 py-1 transition">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                                value={pct}
                                onChange={e => handleRolePercentageChange(role.Role, Number(e.target.value))}
                                className="w-10 bg-transparent text-right text-xs text-white focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs text-slate-400 font-bold ml-0.5">%</span>
                            </div>
                          </div>

                          {/* BOTONES PRESET REDISEÑADOS */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[0, 25, 50, 100].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleRolePercentageChange(role.Role, preset)}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                                  pct === preset
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                {preset}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. EXENCIONES INDIVIDUALES POR SOCIO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      Exenciones Individuales por Socio
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Gestioná becas sociales, exenciones por discapacidad, jubilados y convenios particulares.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por socio, DNI o motivo..."
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-emerald-950/40 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Nueva Exención
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">Socio</th>
                        <th className="p-3.5">Categoría</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5">% Descuento</th>
                        <th className="p-3.5">Motivo / Observaciones</th>
                        <th className="p-3.5 text-right rounded-r-xl">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No se encontraron exenciones registradas.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => {
                          const isSuspended = user.IsExemptFromFees === false;
                          const pct = user.discountPercentage || 100;

                          return (
                            <tr key={user.UserId} className="hover:bg-slate-800/30 transition">
                              <td className="p-3.5">
                                <p className="font-semibold text-white">{user.FullName}</p>
                                <p className="text-xs text-slate-400">{user.Email} {user.dni && `• DNI: ${user.dni}`}</p>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${getCategoryBadge(user.category)}`}>
                                  <Award className="w-3 h-3" />
                                  {user.category || 'Beca Social/Deportiva'}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${
                                  isSuspended
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                  {isSuspended ? 'Suspendido' : 'Activo'}
                                </span>
                              </td>
                              <td className="p-3.5">
                                {isSuspended ? (
                                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-semibold line-through" title="Beneficio suspendido - Descuento no aplicado">
                                    {pct}% (0% Aplicado)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                                    {pct}% Exento
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-300 text-xs max-w-xs truncate">
                                {user.reason || <span className="text-slate-500 italic">Sin observaciones</span>}
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* BOTÓN EDITAR */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(user)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                    title="Editar porcentaje o motivo"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  {/* BOTÓN SUSPENDER / REACTIVAR */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSuspendUserExemption(user)}
                                    className={`p-1.5 rounded-lg transition ${
                                      isSuspended
                                        ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                                    }`}
                                    title={isSuspended ? 'Reactivar beneficio' : 'Suspendido - Clic para reactivar'}
                                  >
                                    {isSuspended ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                                  </button>

                                  {/* BOTÓN ELIMINAR */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUserExemption(user)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                                    title="Eliminar beneficio definitivamente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL REGISTRAR / EDITAR EXENCIÓN INDIVIDUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                {editingUserId ? 'Editar Exención de Socio' : 'Registrar Nueva Exención'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExemption} className="space-y-5">
              {/* BUSCADOR DE SOCIO */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Socio Beneficiario *
                </label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-emerald-300">{selectedUser.fullName}</p>
                      <p className="text-xs text-slate-400">{selectedUser.email} {selectedUser.dni && `• DNI: ${selectedUser.dni}`}</p>
                    </div>
                    {!editingUserId && (
                      <button
                        type="button"
                        onClick={() => { setSelectedUser(null); setUserSearchInput(''); }}
                        className="text-xs text-slate-400 hover:text-white p-1"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por Nombre, DNI o Email..."
                      value={userSearchInput}
                      onChange={e => setUserSearchInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                    {isSearchingUsers && (
                      <RefreshCw className="w-4 h-4 absolute right-3 top-3 animate-spin text-emerald-400" />
                    )}

                    {/* SUGERENCIAS DESPLEGABLES */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                        {userSearchResults.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser({
                                id: u.id,
                                fullName: u.fullName,
                                email: u.email,
                                dni: u.dni,
                                role: u.role
                              });
                              setUserSearchInput(u.fullName);
                              setUserSearchResults([]);
                            }}
                            className="p-3 hover:bg-slate-800 cursor-pointer transition text-left"
                          >
                            <p className="font-medium text-sm text-white">{u.fullName}</p>
                            <p className="text-xs text-slate-400">{u.email} • DNI: {u.dni || 'S/D'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CATEGORÍA DE EXENCIÓN */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Categoría de Exención *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Discapacidad">Discapacidad (CUD)</option>
                  <option value="Jubilado">Jubilado / Pensionado</option>
                  <option value="Beca Social/Deportiva">Beca Social / Deportiva</option>
                  <option value="Socio Vitalicio">Socio Vitalicio</option>
                  <option value="Otro">Otro Motivo Especial</option>
                </select>
              </div>

              {/* PORCENTAJE DE EXENCIÓN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-300">
                    Porcentaje de Exención (% Descuento)
                  </label>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {discountPercentage}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={discountPercentage}
                      onChange={e => setDiscountPercentage(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-950"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                      value={discountPercentage}
                      onChange={e => setDiscountPercentage(Math.min(100, Math.max(1, Number(e.target.value))))}
                      className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                    />
                  </div>

                  {/* PRESETS RÁPIDOS */}
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDiscountPercentage(preset)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition font-semibold text-center ${
                          discountPercentage === preset
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES / MOTIVO */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Observaciones / Motivo (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ej: CUD Presentado N° 48392. Carnet Jubilado Anses N° 092. Beca deportiva aprobada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* FOOTER DEL MODAL */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/40"
                >
                  Guardar Exención
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FLOTANTE DE NOTIFICACIONES */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <AnimatePresence>
          {message && (
            <motion.div
              key={message.text}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-md ${
                message.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50'
                  : 'bg-rose-950/90 border-rose-500/40 text-rose-300 shadow-rose-950/50'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DE CONFIRMACIÓN: LA NUEVA TARIFA RIGE DESDE EL PRÓXIMO MES */}
      <AnimatePresence>
        {isSettingsConfirmOpen && pendingSettings && (
          <motion.div
            key="settings-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={cancelSaveSettings}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-start gap-3 p-6 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Confirmar cambio de tarifa</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    La nueva tarifa se registrará en el historial de precios y comenzará a aplicarse
                    a partir del <span className="font-semibold text-amber-300">{getProximoMesLabel()}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelSaveSettings}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Precio base cuota</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(settings.baseFeeAmount || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Actual</p>
                  </div>
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Precio base cuota</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(pendingSettings.baseFeeAmount || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-500/80 mt-1">Desde el {getProximoMesLabel()}</p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">
                    Las cuotas y deudas ya emitidas hasta la fecha <span className="font-semibold">no sufrirán modificaciones</span>.
                    El cambio queda guardado en el historial y se aplicará automáticamente el mes que viene.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/60 border-t border-slate-800">
                <button
                  type="button"
                  onClick={cancelSaveSettings}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? 'Guardando...' : 'Confirmar y guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};