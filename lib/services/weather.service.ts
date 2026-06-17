const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "";

export async function getWeather(city: string) {
  const params = new URLSearchParams({ q: city, units: "metric", appid: API_KEY, lang: "es" });
  const res = await fetch(`${WEATHER_URL}?${params}`);
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
