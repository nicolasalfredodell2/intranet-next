const WEATHER_URL = "https://tempo-testing.tribcuentasrionegro.gov.ar/clima";

export interface WeatherData {
  ubicacion: string;
  descripcion: string;
  temperatura: number;
  sensacion_termica: number;
  temp_min: number;
  temp_max: number;
  prob_lluvia: number;
  viento_kmh: number;
  icono: string;
  actualizado: string;
}

export async function getWeather(): Promise<WeatherData> {
  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error("Error cargando clima");
  return res.json();
}

export function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    "01d": "fas fa-sun",
    "01n": "fas fa-moon",
    "02d": "fas fa-cloud-sun",
    "02n": "fas fa-cloud-moon",
    "03d": "fas fa-cloud",
    "03n": "fas fa-cloud",
    "04d": "fas fa-cloud",
    "04n": "fas fa-cloud",
    "09d": "fas fa-cloud-showers-heavy",
    "09n": "fas fa-cloud-showers-heavy",
    "10d": "fas fa-cloud-sun-rain",
    "10n": "fas fa-cloud-moon-rain",
    "11d": "fas fa-bolt",
    "11n": "fas fa-bolt",
    "13d": "fas fa-snowflake",
    "13n": "fas fa-snowflake",
    "50d": "fas fa-smog",
    "50n": "fas fa-smog",
  };
  return iconMap[iconCode] || "fas fa-cloud";
}
