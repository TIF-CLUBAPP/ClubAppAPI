import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Percent, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import { paymentsService } from '../services/paymentsService';
import type { FeeSettings, RoleExemption, UserExemption } from '../types/cuotas';

export const PagosCuotas: React.FC = () => {
  // Estados de Configuración
  const [settings, setSettings] = useState<FeeSettings>({
    baseFeeAmount: 0,
    lateFeePercentage: 0,
    dueDayOfMonth: 10,
  });

  // Estados de Exenciones
  const [roleExemptions, setRoleExemptions] = useState<RoleExemption[]>([]);
  const [userExemptions, setUserExemptions] = useState<UserExemption[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // Estados UI
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, exemptionsData] = await Promise.all([
        paymentsService.getSettings(),
        paymentsService.getExemptions(),
      ]);
      setSettings(settingsData);
      setRoleExemptions(exemptionsData.Roles || []);
      setUserExemptions(exemptionsData.Users || []);
    } catch (err) {
      setMessage({ text: 'Error al cargar los datos del módulo de cuotas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await paymentsService.updateSettings(settings);
      setMessage({ text: 'Configuración guardada correctamente.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'No se pudo guardar la configuración.', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleRoleExemption = async (roleName: string, currentStatus: boolean) => {
    try {
      await paymentsService.toggleRoleExemption(roleName, !currentStatus);
      setRoleExemptions(prev =>
        prev.map(r => r.Role === roleName ? { ...r, AreFeesExempt: !currentStatus } : r)
      );
      setMessage({ text: `Exención actualizada para el rol ${roleName}.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error al actualizar exención por rol.', type: 'error' });
    }
  };

  const handleToggleUserExemption = async (userId: number, currentStatus: boolean) => {
    try {
      await paymentsService.toggleUserExemption(String(userId), !currentStatus);
      setUserExemptions(prev =>
        prev.map(u => u.UserId === userId ? { ...u, IsExemptFromFees: !currentStatus } : u)
      );
      setMessage({ text: 'Estado de exención del usuario actualizado.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error al actualizar exención individual.', type: 'error' });
    }
  };

  const filteredUsers = userExemptions.filter(u =>
    u.FullName.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.Email.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        <span>Cargando panel de gestión de cuotas...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos & Cuotas</h1>
        <p className="text-slate-400 text-sm">
          Administrá el monto de la cuota social, recargos por mora y exenciones por rol o socio.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. CONFIGURACIÓN GENERAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Configuración de Precios y Mora
        </h2>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Precio Base Cuota ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="number"
                value={settings.baseFeeAmount}
                onChange={e => setSettings({ ...settings, baseFeeAmount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Recargo por Mora (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={settings.lateFeePercentage}
                onChange={e => setSettings({ ...settings, lateFeePercentage: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

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
                value={settings.dueDayOfMonth}
                onChange={e => setSettings({ ...settings, dueDayOfMonth: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-xl transition"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. GESTIÓN DE EXENCIONES POR ROL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Exención de Cuota por Rol Completo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleExemptions.map(role => (
            <div
              key={role.Role}
              className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl"
            >
              <div>
                <p className="font-medium">{role.Role}</p>
                <p className="text-xs text-slate-400">
                  {role.AreFeesExempt ? 'Exento de pago' : 'Obligado a pagar'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleRoleExemption(role.Role, role.AreFeesExempt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  role.AreFeesExempt
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {role.AreFeesExempt ? 'Exento' : 'Paga Cuota'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GESTIÓN DE EXENCIONES INDIVIDUALES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            Exenciones Individuales por Socio
          </h2>
          <input
            type="text"
            placeholder="Buscar socio por nombre o email..."
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3 rounded-l-lg">Socio</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado Cuota</th>
                <th className="p-3 text-right rounded-r-lg">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map(user => (
                <tr key={user.UserId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3">
                    <p className="font-medium">{user.FullName}</p>
                    <p className="text-xs text-slate-500">{user.Email}</p>
                  </td>
                  <td className="p-3 text-slate-400">{user.Role}</td>
                  <td className="p-3">
                    {user.IsExemptFromFees ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <UserX className="w-3 h-3" /> Exento
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <UserCheck className="w-3 h-3" /> Cobro Activo
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleUserExemption(user.UserId, user.IsExemptFromFees)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        user.IsExemptFromFees
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                      }`}
                    >
                      {user.IsExemptFromFees ? 'Quitar Exención' : 'Eximir de Cuota'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};