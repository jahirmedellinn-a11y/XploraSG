// Clases compartidas de los paneles (v3 · Editorial natural).
/** Superficie de trabajo: blanca, plana, filete beige de 1px. */
export const panelSurface = 'rounded-xl border border-brand-sand bg-white';
/** Etiqueta de campo de formulario. */
export const fieldLabel = 'text-[13px] font-medium text-brand-blue/80';
/** Botones compactos y discretos para acciones dentro de los paneles. */
export const quietButton = 'btn btn-secondary min-h-9 px-4 py-1.5 !text-[13px]';
export const quietPrimary = 'btn btn-primary min-h-9 px-4 py-1.5 !text-[13px]';
export const quietAccent = 'btn btn-accent min-h-9 px-4 py-1.5 !text-[13px]';
export const quietDanger = 'btn min-h-9 border border-clay-200 bg-white px-4 py-1.5 !text-[13px] text-clay-700 hover:border-clay-300 hover:bg-clay-50';
export const quietGhost = 'btn btn-ghost min-h-9 px-3 py-1.5 !text-[13px]';

/** Pestaña de texto subrayada (navegación de sección o filtro principal). */
export const tabClass = (active: boolean) =>
  `relative inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap text-[13.5px] transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:transition-colors after:duration-300 ${
    active ? 'font-medium text-brand-blue after:bg-brand-blue' : 'text-brand-blue/70 after:bg-transparent hover:text-brand-blue hover:after:bg-brand-sand'
  }`;

/** Filtro secundario tipo «chip» con contorno fino. */
export const filterChipClass = (active: boolean) =>
  `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors duration-300 ${
    active ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-sand bg-white text-brand-blue/70 hover:border-brand-blue/30 hover:text-brand-blue'
  }`;
