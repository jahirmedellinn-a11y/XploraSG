// Iconos de línea complementarios (mismo trazo que src/components/brand/icons.tsx).
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const Svg = ({ children, className = 'size-5', ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
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

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
);
export const TicketIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 6.5h17v3.5a2 2 0 0 0 0 4v3.5h-17V14a2 2 0 0 0 0-4Z" /><path d="M14.5 7v1.5M14.5 11.2v1.6M14.5 15.5V17" /></Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" /></Svg>
);
export const AccessIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="4.8" r="1.6" /><path d="M5.5 8.5 12 10l6.5-1.5" /><path d="M12 10v4.5l-3 6M12 14.5l3 6" /></Svg>
);
export const InfoIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Svg>
);
export const BookmarkIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 3.5h10v17l-5-3.5-5 3.5Z" /></Svg>
);
export const UsersIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3.5 19.5v-1a5.5 5.5 0 0 1 11 0v1" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 2.5 4.5v1" /></Svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
);
export const ShareIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 13.2 7.6 4.1M15.8 6.7l-7.6 4.1" /></Svg>
);
export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14 4.5h5.5V10M19.5 4.5 11 13" /><path d="M17.5 13.5v5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18.5V8.5A1.5 1.5 0 0 1 6 7h5" /></Svg>
);
export const NavigationIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 4 4 10.5l7 2.5 2.5 7Z" /></Svg>
);
export const FilterIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 6.5h16M7 12h10M10 17.5h4" /></Svg>
);

// Clima
export const SunIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Svg>
);
export const CloudSunIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8.5 5.5V4M3.8 7.2l1 1M13.2 7.2l-1 1M2.5 11.5H4" /><path d="M5.6 12.6a3.5 3.5 0 0 1 6.4-3" /><path d="M8 19.5h9.5a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.4 1.3A2.9 2.9 0 0 0 8 19.5Z" /></Svg>
);
export const FogIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6.5 13.5a4 4 0 0 1 1.3-7.8 5.5 5.5 0 0 1 10.4 2.1 3 3 0 0 1-.7 5.7" /><path d="M4 16.5h16M6.5 20h11" /></Svg>
);
export const RainIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 15.5a4 4 0 0 1 .8-7.9 5.5 5.5 0 0 1 10.4 2 3 3 0 0 1-.2 5.9" /><path d="m9 18-1 2.5M13 18l-1 2.5M17 18l-1 2.5" /></Svg>
);
export const StormIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 15.5a4 4 0 0 1 .8-7.9 5.5 5.5 0 0 1 10.4 2 3 3 0 0 1-.2 5.9" /><path d="m12.5 13-2.5 4h4l-2.5 4" /></Svg>
);
export const WindIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 13h15a2.5 2.5 0 1 1-2.5 2.5M3 17h7" /></Svg>
);
export const ThermometerIcon = (p: IconProps) => (
  <Svg {...p}><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0Z" /><path d="M12 9v6" /></Svg>
);

// Actividades y servicios (rejilla de "amenidades" en las fichas)
export const CameraIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" /><circle cx="12" cy="12.8" r="3.3" /></Svg>
);
export const WavesIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 8c1.5 0 1.5-1.2 3-1.2S7.5 8 9 8s1.5-1.2 3-1.2S13.5 8 15 8s1.5-1.2 3-1.2S19.5 8 21 8" /><path d="M3 12.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" /><path d="M3 17c1.5 0 1.5-1.2 3-1.2S7.5 17 9 17s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" /></Svg>
);
export const TentIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 4 3 19.5h18Z" /><path d="M12 4v15.5M9 19.5l3-6 3 6" /></Svg>
);
export const BirdIcon = (p: IconProps) => (
  <Svg {...p}><path d="M16 7.5a2.5 2.5 0 0 1 4.5 1.5l-2 .5c0 5-3.6 8.5-9 8.5H4.5c3-1 5-3 5.5-5.5" /><path d="M16 7.5c-3 0-5 2.2-6 4.5L6.5 9.5" /><path d="m9 17.9-1 2.6M12 17.6l-.4 2.9" /><circle cx="17.4" cy="8.6" r=".4" fill="currentColor" /></Svg>
);
export const BikeIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16 9.5 9h6L18 16M9.5 9 12 16h-6M14 6h2.5l-1 3" /></Svg>
);
export const MountainIcon = (p: IconProps) => (
  <Svg {...p}><path d="m3 19.5 6.5-11 4 6.5 2-3 5.5 7.5Z" /><path d="m8 11 1.5 1.5L11 11" /></Svg>
);
export const StarIcon = (p: IconProps) => (
  <Svg {...p}><path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6Z" /></Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="m14.5 6-6 6 6 6" /></Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="m9.5 6 6 6-6 6" /></Svg>
);
export const ArrowUpRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 17 17 7M8.5 7H17v8.5" /></Svg>
);
