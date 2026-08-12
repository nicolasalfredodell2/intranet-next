"use client";

import {
  Newspaper,
  CalendarHeart,
  ClipboardList,
  Phone,
  CalendarClock,
  Clapperboard,
  Headset,
  UserRound,
  Clock4,
  FileText,
  CalendarOff,
  Receipt,
  DoorOpen,
  ListChecks,
  Building2,
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
    title: "Agenda telefónica",
    description: "Buscá el interno de cualquier compañero por apellido, al instante.",
    icon: Phone,
    gradient: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  },
  {
    number: "005",
    title: "Próximos eventos",
    description: "No te pierdas las fechas y eventos institucionales que se vienen.",
    icon: CalendarClock,
    gradient: "linear-gradient(135deg, #ecfeff, #cffafe)",
  },
  {
    number: "006",
    title: "Shorts",
    description: "Mirá videos cortos con novedades y contenido institucional.",
    icon: Clapperboard,
    gradient: "linear-gradient(135deg, #fdf4ff, #fae8ff)",
  },
  {
    number: "007",
    title: "Soporte técnico",
    description: "Chateá en vivo con soporte técnico ante cualquier inconveniente.",
    icon: Headset,
    gradient: "linear-gradient(135deg, #fff7ed, #ffedd5)",
  },
  {
    number: "008",
    title: "Perfil",
    description: "Consultá y actualizá tus datos personales y de contacto.",
    icon: UserRound,
    gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  },
  {
    number: "009",
    title: "Fichadas",
    description: "Revisá tus fichadas diarias y el detalle de tu jornada laboral.",
    icon: Clock4,
    gradient: "linear-gradient(135deg, #fefce8, #fef9c3)",
  },
  {
    number: "010",
    title: "Legajo",
    description: "Accedé a la documentación y archivos de tu legajo personal.",
    icon: FileText,
    gradient: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
  },
  {
    number: "011",
    title: "Licencias",
    description: "Solicitá licencias y consultá el estado de tus pedidos.",
    icon: CalendarOff,
    gradient: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
  },
  {
    number: "012",
    title: "Recibos de sueldo",
    description: "Descargá tus recibos de sueldo cuando los necesites.",
    icon: Receipt,
    gradient: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
  },
  {
    number: "013",
    title: "Salidas",
    description: "Registrá y consultá tus salidas durante la jornada laboral.",
    icon: DoorOpen,
    gradient: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
  },
  {
    number: "014",
    title: "Encuestas",
    description: "Participá de las encuestas y dejá tu opinión al organismo.",
    icon: ListChecks,
    gradient: "linear-gradient(135deg, #fef2f2, #fee2e2)",
  },
  {
    number: "015",
    title: "Áreas",
    description: "Conocé las distintas áreas y sectores del organismo.",
    icon: Building2,
    gradient: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
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
          animation: marqueeRight 90s linear infinite;
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
