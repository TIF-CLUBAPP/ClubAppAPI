import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

const DEFAULT_REFRESH_INTERVAL_MS = 20_000; // Polling cada 20 segundos

interface UseDashboardStatsResult {
  stats: DashboardStats | null;
  /** true solo en la primera carga (sin datos aún). */
  loading: boolean;
  /** true durante actualizaciones automáticas/manuales con datos ya cargados. */
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  /** Fuerza una recarga manual inmediata. */
  refresh: () => void;
}

/**
 * Hook que obtiene las estadísticas del Dashboard y las mantiene actualizadas
 * mediante polling automático cada `intervalMs` milisegundos (por defecto 20s).
 */
export function useDashboardStats(
  intervalMs: number = DEFAULT_REFRESH_INTERVAL_MS
): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMounted = useRef(true);
  const inFlight = useRef(false);

  const fetchStats = useCallback(async (silent = false) => {
    // Evita requests superpuestos cuando el polling y un refresh manual coinciden.
    if (inFlight.current) return;
    inFlight.current = true;

    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await dashboardService.getStats();
      if (isMounted.current) {
        setStats(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Error obteniendo estadísticas del dashboard:', err);
      if (isMounted.current) {
        setError('No se pudieron cargar las estadísticas en este momento.');
      }
    } finally {
      inFlight.current = false;
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchStats();

    const interval = window.setInterval(() => fetchStats(true), intervalMs);

    return () => {
      isMounted.current = false;
      window.clearInterval(interval);
    };
  }, [fetchStats, intervalMs]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refreshing, error, lastUpdated, refresh };
}
