"use client";

import {
  Newspaper,
  CalendarHeart,
  ClipboardList,
  FingerprintPattern,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    number: "001",
    title: "Noticias institucionales",
    description: "Mantenete al día con las últimas novedades y comunicados del organismo.",
    icon: Newspaper,
    gradient: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
  },
  {
    number: "002",
    title: "Calendario y cumpleaños",
    description: "Consultá eventos, fechas importantes y festejá los cumpleaños del equipo.",
    icon: CalendarHeart,
    gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)",
  },
  {
    number: "003",
    title: "Avisos y ausencias",
    description: "Gestioná tus avisos de ausencia y seguí el estado de tus solicitudes.",
    icon: ClipboardList,
    gradient: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
  },
  {
    number: "004",
    title: "Fichada remota",
    description: "Registrá tu asistencia desde una ubicación remota cuando lo necesites.",
    icon: FingerprintPattern,
    gradient: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  },
];

// Se duplica la lista para que la animacion pueda volver de -50% a 0% sin
// salto visible: en -50% el segundo set queda pixel a pixel donde arrancaba
// el primero, asi el loop es indistinguible del contenido real.
const TRACK_ITEMS = [...FEATURES, ...FEATURES];

export default function LoginFeaturesCarousel() {
  return (
    <div className="login-marquee">
      <div className="login-marquee-track">
        {TRACK_ITEMS.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={`${feature.number}-${i}`} className="login-feature-card" style={{ background: feature.gradient }}>
              <span className="login-feature-number">( {feature.number} )</span>
              <Icon size={38} strokeWidth={1.6} color="#4a6cf7" />
              <div>
                <h3 className="login-feature-title">{feature.title}</h3>
                <p className="login-feature-description">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .login-marquee {
          width: 100%;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
        }

        .login-marquee-track {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: marqueeRight 24s linear infinite;
        }

        @keyframes marqueeRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0%); }
        }

        .login-feature-card {
          flex: 0 0 280px;
          height: 280px;
          border-radius: 22px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
        }

        .login-feature-number {
          font-family: monospace;
          font-size: 0.8rem;
          color: rgba(30, 41, 59, 0.4);
        }

        .login-feature-title {
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #1e293b;
          margin: 0 0 6px;
        }

        .login-feature-description {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 900px) {
          .login-feature-card {
            flex-basis: 210px;
            height: 230px;
            padding: 22px;
          }
        }
      `}</style>
    </div>
  );
}
