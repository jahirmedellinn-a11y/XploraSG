// Iconos de línea complementarios para los paneles (mismo trazo fino redondeado que brand/icons).
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const Svg = ({ children, className = 'size-5', ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const CheckCircleIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.3 4.6-4.8" /></Svg>;
export const AlertIcon = (p: IconProps) => <Svg {...p}><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.2M12 17h.01" /></Svg>;
export const MinusCircleIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12h7" /></Svg>;
export const EyeIcon = (p: IconProps) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></Svg>;
export const ChatIcon = (p: IconProps) => <Svg {...p}><path d="M4 18.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8.5L4 20Z" /><path d="M8.5 9.5h7M8.5 12.5h4.5" /></Svg>;
export const PhoneIcon = (p: IconProps) => <Svg {...p}><path d="M5 4.5h3.2l1.6 4-2 1.3a10 10 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z" /></Svg>;
export const UsersIcon = (p: IconProps) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" /><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M18 13.7a5 5 0 0 1 3 4.8v1" /></Svg>;
export const StoreIcon = (p: IconProps) => <Svg {...p}><path d="M4 9.5 5.5 4.5h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12v7.5h13V12" /><path d="M10 19.5v-4h4v4" /></Svg>;
export const TagIcon = (p: IconProps) => <Svg {...p}><path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.7 6.7a1.5 1.5 0 0 1-2.1 0Z" /><circle cx="8" cy="8" r="1.4" /></Svg>;
export const EditIcon = (p: IconProps) => <Svg {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></Svg>;
export const TrashIcon = (p: IconProps) => <Svg {...p}><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l.9 12.5h9.2L17.5 7" /><path d="M10 11v5M14 11v5" /></Svg>;
export const ClockIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></Svg>;
export const InboxIcon = (p: IconProps) => <Svg {...p}><path d="M3.5 13.5 6 5h12l2.5 8.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" /><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" /></Svg>;
export const ExternalIcon = (p: IconProps) => <Svg {...p}><path d="M14 4.5h5.5V10" /><path d="M19.5 4.5 11 13" /><path d="M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10" /></Svg>;
export const ChartIcon = (p: IconProps) => <Svg {...p}><path d="M4 4.5v15h16" /><path d="M8 15.5V12M12 15.5V8M16 15.5v-5" /></Svg>;
export const LinkIcon = (p: IconProps) => <Svg {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;
export const TargetIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" /></Svg>;
export const StarIcon = (p: IconProps) => <Svg {...p}><path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7Z" /></Svg>;
export const ShareIcon = (p: IconProps) => <Svg {...p}><circle cx="17.5" cy="5.5" r="2.3" /><circle cx="6.5" cy="12" r="2.3" /><circle cx="17.5" cy="18.5" r="2.3" /><path d="m8.5 10.8 7-4.1M8.5 13.2l7 4.1" /></Svg>;
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const ArrowLeftIcon = (p: IconProps) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const MailIcon = (p: IconProps) => <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></Svg>;
export const FileIcon = (p: IconProps) => <Svg {...p}><path d="M6 3.5h8l4.5 4.5v12.5H6Z" /><path d="M13.5 3.5V8.5h5M9 13h6M9 16.5h4" /></Svg>;
export const XCircleIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Svg>;
export const PauseCircleIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></Svg>;
export const DraftIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" strokeDasharray="3 2.6" /></Svg>;
