"use client";

import { useEffect, useState, useRef } from "react";
import { getWeather, getWeatherIcon } from "@/lib/services/weather.service";

interface WeatherProps {
  onSearch: (title: string) => void;
}

export default function Weather({ onSearch }: WeatherProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getWeather("Viedma").then(setWeatherData).catch(() => {});
  }, []);

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 1000);
  };

  const round = (n: number) => Math.round(n);

  return (
    <div className="row row-main">
      <div className="col-12 section-weather" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="px-md-4 row align-items-center m-0 w-100">

          <div className="col-12 col-md-6 d-md-flex align-items-center jujstify-content-center pr-md-5">
            <div className="search-input-group">
              <i className="fas fa-search search-icon" />
              <input
                onKeyUp={onKeyPress}
                className="input-search-note search-with-icon"
                placeholder="Busque notas aquí"
                type="text"
              />
            </div>
          </div>

          {weatherData && (
            <div className="col-12 col-md-6 d-none d-md-block">
              <div className="row">
                <div className="col-8 text-white">
                  <p className="text-white mb-1">
                    <i className="fas fa-location-dot mr-2" />
                    <span className="text-location">Viedma Río Negro</span>
                  </p>
                  <p className="capitalize mb-1 text-weater">
                    {weatherData.weather[0].description}
                  </p>
                  <p className="mb-1 text-temp">
                    {round(weatherData.main.temp)}°C
                  </p>
                  <p className="mb-2 text-sensation">
                    Sensación Térmica {round(weatherData.main.feels_like)}°C
                  </p>
                  <p className="mb-1 text-min-max">
                    Mín {round(weatherData.main.temp_min)}°C / Máx {round(weatherData.main.temp_max)}°C
                  </p>
                  <p className="mt-1 mb-0 text-rain">
                    <i className="fas fa-cloud-showers-heavy" /> Lluvias: {weatherData.rain ? weatherData.rain : "0"}%
                    <i className="fas fa-wind ml-2" /> Viento: {round(weatherData.wind.speed)} km/h
                  </p>
                </div>

                <div className="col-4 d-flex align-items-center justify-content-center">
                  <i
                    className={getWeatherIcon(weatherData.weather[0].icon)}
                    style={{ fontSize: "6rem", color: "#ffffff", textShadow: "2px 2px 8px rgba(0,0,0,0.2)" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        p {
          font-family: Montserrat;
          margin-bottom: 0px;
        }

        .input-search-note {
          background-color: #E5E7EB;
          border: none;
          border-radius: 39px;
          height: 50px;
          padding-left: 20px;
          width: 100%;
          color: #000;
        }

        .search-input-group {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 1rem;
          pointer-events: none;
        }

        .search-with-icon { padding-left: 44px; }

        .input-search-note::placeholder {
          color: #000 !important;
        }

        .row-main {
          padding-left: 15px;
          padding-right: 15px;
        }

        .section-weather {
          background-image: linear-gradient(to bottom right, #5C6373, #454C5C, #5C6373);
          border-radius: 12px;
          max-height: 162px;
          min-height: 162px;
          height: 162px !important;
          background-size: 400% 400%;
          animation: movimientoGradiente 4s ease infinite;
        }

        .capitalize { text-transform: capitalize; }

        .text-location {
          font-size: clamp(10px, 10vw, 10px) !important;
          font-weight: 400 !important;
          line-height: clamp(15px, 3.5vw, 15px) !important;
        }

        .text-weater {
          font-size: clamp(14px, 10vw, 14px) !important;
          font-weight: 400 !important;
          line-height: clamp(17px, 3.5vw, 17px) !important;
        }

        .text-temp {
          font-size: clamp(48px, 10vw, 48px) !important;
          font-weight: 700 !important;
          line-height: clamp(45px, 3.5vw, 45px) !important;
        }

        .text-sensation {
          font-size: clamp(16px, 10vw, 16px) !important;
          font-weight: 700 !important;
          line-height: clamp(11px, 3.5vw, 11px) !important;
        }

        .text-min-max {
          font-size: clamp(12px, 10vw, 12px) !important;
          font-weight: 400 !important;
          line-height: clamp(11px, 3.5vw, 11px) !important;
        }

        .text-rain {
          font-size: clamp(11px, 10vw, 11px) !important;
          font-weight: 400 !important;
          line-height: clamp(16px, 3.5vw, 16px) !important;
        }

        @keyframes movimientoGradiente {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @media (max-width: 768px) {
          .input-search-note {
            background-color: #FFF;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .section-weather {
            background-image: none;
            height: 40px !important;
            margin-top: 30px;
          }

          .row-main {
            padding-left: 0px;
            padding-right: 0px;
          }
        }
      `}</style>
    </div>
  );
}
