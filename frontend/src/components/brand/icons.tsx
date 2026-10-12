/* eslint-disable react-refresh/only-export-components */
// Iconografía de línea de XploraSG, dibujada siguiendo la hoja de marca (sección 4. Iconografía):
// trazo fino redondeado, sin rellenos, en los colores de la paleta.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Svg = ({ size, children, className = 'size-6', ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const NatureIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19 13 11" /><path d="M9.5 15H13M11 13V9.5" /></Svg>
);
export const CultureIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 3.5h8M9 3.5v2c-2.6 1-4 3.2-4 6.2 0 4.3 2.9 7.8 7 7.8s7-3.5 7-7.8c0-3-1.4-5.2-4-6.2v-2" /><path d="M5.5 10.5h13M6 14.5h12" /><path d="m9 12.5 1.5-1 1.5 1 1.5-1 1.5 1" /><path d="M9 20.5h6" /></Svg>
);
export const AdventureIcon = (p: IconProps) => (
  <Svg {...p}><path d="m2.5 19 6.2-10 3.3 5.2 2.4-3.7 7.1 8.5Z" /><path d="m7 11.5 1.7 1.3 1.6-1.2" /><path d="m13.2 13.4 1.2.9 1.1-.8" /></Svg>
);
export const RouteIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="6" cy="18" r="2" /><path d="M18 9.5c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 2.2 3 5 3 5" /><path d="M8 18h6.5a3.5 3.5 0 0 0 0-7H10a3 3 0 0 1 0-6h2" strokeDasharray="0.1 3" /></Svg>
);
export const ExperienceIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="6.5" width="18" height="13" rx="3" /><path d="m8.5 6.5 1.4-2.5h4.2l1.4 2.5" /><circle cx="12" cy="13" r="3.6" /><path d="M17.5 9.5h.01" /></Svg>
);
export const CommunityIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="7" r="2.6" /><circle cx="5.5" cy="9" r="2.1" /><circle cx="18.5" cy="9" r="2.1" /><path d="M7.5 19.5v-2.2a4.5 4.5 0 0 1 9 0v2.2" /><path d="M2.5 18.5v-1.4A3.3 3.3 0 0 1 7 14" /><path d="M21.5 18.5v-1.4A3.3 3.3 0 0 0 17 14" /></Svg>
);
export const LodgingIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9.5h14V10" /><path d="M9.5 19.5v-5h5v5" /></Svg>
);
export const FoodIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" /><path d="M8 20.5h8" /><path d="M9 8.5c0-1.5 1-1.5 1-3M12.5 8.5c0-1.5 1-1.5 1-3M16 8.5c0-1.5 1-1.5 1-3" /></Svg>
);
export const MissionIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 2.5v3M5.5 4h3" /><path d="M5 9a2 2 0 0 1 4 0v11.5" /><path d="M4.5 9.5h5" /><path d="M9 12.5h1.5a2 2 0 0 1 1.5-1.8 2 2 0 0 1 1.5 1.8h6v8H9" /><path d="M12.5 20.5v-3a1.5 1.5 0 0 1 3 0v3" /><path d="M3 20.5h18" /></Svg>
);
export const MapIcon = (p: IconProps) => (
  <Svg {...p}><path d="m9 4.5-5.5 2v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2Z" /><path d="M9 4.5v13M15 6.5v13" /></Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></Svg>
);
export const CompassIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></Svg>
);
export const PinIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></Svg>
);
export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const HeartIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" /></Svg>
);
export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const WifiOffIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.6M14 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.5-2.8M10.5 5.6A15 15 0 0 1 22 9.5" /><path d="M12 20h.01" /></Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></Svg>
);
export const MicIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></Svg>
);
export const SpeakerIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></Svg>
);
export const SpeakerOffIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></Svg>
);
export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3.5 13.8 10l6.7 2-6.7 2-1.8 6.5-1.8-6.5-6.7-2 6.7-2L12 3.5Z" /></Svg>
);

/**
 * Chatboot: guacamaya posada en una rama, dibujada a una sola línea como en una libreta de campo.
 * El trazo mide siempre 1.5 px (vector-effect), sin importar el tamaño del ícono. Usa el color del texto.
 */
export const BirdMark = ({ className = 'size-8', title }: { className?: string; title?: string }) => (
  <svg
    viewBox="2.4 1.6 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <g vectorEffect="non-scaling-stroke">
      {[
        'M17.2 9.8C17.1 6.8 19.1 4.8 21.6 4.9c1.8.1 3 1.1 3.5 2.5',
        'M25.1 7.4c1.5.1 2.3 1.4 2 3-.2.8-.6 1.4-1.2 1.7-.1-.9-.5-1.5-1.1-1.8',
        'M24.8 10.3c0 .9-.6 1.6-1.5 1.9',
        'M23.3 12.2c.5 3.3-.5 6.8-2.7 9.2',
        'M17.2 9.8c-1 3-1.2 6.7-.1 9.9.5 1.1 1.3 1.9 2.3 2.1',
        'M18.5 11.8c2 1.3 2.7 4.1 2 7.1',
        'M18.6 21.5c-1.2 3.3-3 6.1-5.4 8.3M20.1 21.9c-.7 3.3-2.2 6.3-4.5 8.5',
        'M8.6 22.7c5.1-.9 12.1-1 19.6.5',
        'M25.2 22.6c.4-1.3 1.4-2.2 2.8-2.5-.2 1.3-1.2 2.2-2.8 2.5Z',
      ].map((d) => <path key={d} d={d} vectorEffect="non-scaling-stroke" />)}
    </g>
    <circle cx="22" cy="8.3" r=".8" fill="currentColor" stroke="none" />
  </svg>
);

/** Icono y color según la categoría (los nombres vienen en español desde la base). */
export const categoryVisual = (categoria: string | null | undefined) => {
  const name = (categoria ?? '').toLowerCase();
  if (name.includes('natura')) return { Icon: NatureIcon, tone: 'text-brand-green', bg: 'bg-brand-green/10', solid: 'bg-brand-green' };
  if (name.includes('cultura') || name.includes('arqueo')) return { Icon: CultureIcon, tone: 'text-brand-gold', bg: 'bg-brand-gold/12', solid: 'bg-brand-gold' };
  if (name.includes('aventura')) return { Icon: AdventureIcon, tone: 'text-brand-teal', bg: 'bg-brand-teal/10', solid: 'bg-brand-teal' };
  if (name.includes('gastro') || name.includes('comida') || name.includes('aliment')) return { Icon: FoodIcon, tone: 'text-brand-gold', bg: 'bg-brand-gold/12', solid: 'bg-brand-gold' };
  if (name.includes('hosped')) return { Icon: LodgingIcon, tone: 'text-brand-teal', bg: 'bg-brand-teal/10', solid: 'bg-brand-teal' };
  if (name.includes('comunit')) return { Icon: CommunityIcon, tone: 'text-brand-green', bg: 'bg-brand-green/10', solid: 'bg-brand-green' };
  return { Icon: CompassIcon, tone: 'text-brand-blue', bg: 'bg-brand-blue/8', solid: 'bg-brand-blue' };
};
