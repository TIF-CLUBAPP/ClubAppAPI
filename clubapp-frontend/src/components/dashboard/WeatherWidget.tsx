import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudFog, 
  Wind, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  city: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener el clima por latitud y longitud
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener datos meteorológicos de Open-Meteo
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );
      const weatherJson = await weatherRes.json();

      // 2. Obtener el nombre de la ciudad mediante geocodificación inversa
      let cityName = 'Tu ubicación';
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
        );
        const geoJson = await geoRes.json();
        cityName = geoJson.city || geoJson.locality || geoJson.principalSubdivision || 'Tu ciudad';
      } catch (e) {
        console.warn('No se pudo obtener el nombre exacto de la ciudad', e);
      }

      setWeather({
        temp: Math.round(weatherJson.current.temperature_2m),
        humidity: weatherJson.current.relative_humidity_2m,
        windSpeed: Math.round(weatherJson.current.wind_speed_10m),
        weatherCode: weatherJson.current.weather_code,
        city: cityName,
      });
    } catch (err) {
      console.error(err);
      setError('Error al obtener datos del clima.');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar ubicación al navegador
  const getLocationAndFetch = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocalización denegada o con error:', err.message);
        // Ubicación por defecto (por ejemplo Rosario / Bs As si deniega el permiso)
        setError('Ubicación denegada. Mostrando clima predeterminado.');
        fetchWeather(-32.9468, -60.6393); // Rosario por defecto
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    getLocationAndFetch();
  }, []);

  // Mapeo del código WMO a icono y descripción en español
  const getWeatherDetails = (code: number) => {
    if (code === 0) {
      return { label: 'Despejado', icon: <Sun className="w-8 h-8 text-amber-400" /> };
    }
    if ([1, 2, 3].includes(code)) {
      return { label: 'Parcialmente Nublado', icon: <Cloud className="w-8 h-8 text-slate-300" /> };
    }
    if ([45, 48].includes(code)) {
      return { label: 'Niebla', icon: <CloudFog className="w-8 h-8 text-slate-400" /> };
    }
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return { label: 'Lluvia', icon: <CloudRain className="w-8 h-8 text-blue-400" /> };
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return { label: 'Nieve', icon: <CloudSnow className="w-8 h-8 text-cyan-200" /> };
    }
    if ([95, 96, 99].includes(code)) {
      return { label: 'Tormenta', icon: <CloudLightning className="w-8 h-8 text-yellow-400" /> };
    }
    return { label: 'Clima Variable', icon: <Sun className="w-8 h-8 text-amber-400" /> };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
      {/* Header Widget */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
          <MapPin size={14} className="text-emerald-400" />
          <span className="truncate max-w-[140px] text-white">
            {loading ? 'Obteniendo ubicación...' : weather?.city || 'Ubicación'}
          </span>
        </div>

        <button
          onClick={getLocationAndFetch}
          disabled={loading}
          className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all disabled:opacity-50"
          title="Actualizar clima"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
        </button>
      </div>

      {/* Carga */}
      {loading && (
        <div className="py-6 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-400">Consultando reporte...</p>
        </div>
      )}

      {/* Contenido Clima */}
      {!loading && weather && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getWeatherDetails(weather.weatherCode).icon}
              <div>
                <p className="text-3xl font-black text-white">{weather.temp}°C</p>
                <p className="text-xs text-slate-400 font-medium">
                  {getWeatherDetails(weather.weatherCode).label}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50 flex items-center gap-2">
              <Droplets size={14} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Humedad</p>
                <p className="text-xs font-bold text-slate-200">{weather.humidity}%</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50 flex items-center gap-2">
              <Wind size={14} className="text-teal-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Viento</p>
                <p className="text-xs font-bold text-slate-200">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de aviso de error / permiso */}
      {!loading && error && !weather && (
        <div className="py-4 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-amber-400" />
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      )}
    </div>
  );
}