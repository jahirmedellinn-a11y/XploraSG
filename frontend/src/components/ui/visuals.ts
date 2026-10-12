// Utilidades visuales compartidas (v3 · Editorial natural).
// Sin degradados ni vidrio: superficies lisas, filetes de 1px y fotografía.

/** Fondo liso para fichas sin fotografía (se conserva el nombre por compatibilidad). */
export const artGradient = (categoria: string | null | undefined): string => {
  const name = (categoria ?? '').toLowerCase();
  return name.includes('cultura') || name.includes('arqueo') ? 'bg-brand-sand' : 'bg-brand-light';
};

/** Antes: vidrio sobre fotografía. En v3 es una superficie blanca con filete fino. */
export const glassClass = 'bg-white ring-1 ring-brand-blue/10';

/** Botón redondo de flecha (carruseles y galerías). */
export const roundArrowClass =
  'grid size-10 shrink-0 place-items-center rounded-full border border-brand-blue/15 bg-transparent text-brand-blue transition-colors duration-300 hover:border-brand-blue disabled:pointer-events-none disabled:opacity-35';

/** Enlace de texto subrayado con flecha (mismo estilo que el inicio). */
export const textLinkClass =
  'group inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green';

/** Pie de foto / meta en versalitas. */
export const metaClass = 'text-[11px] font-medium uppercase tracking-[0.18em] text-brand-blue/70';

/** Etiqueta pequeña de categoría sobre una fotografía. */
export const photoLabelClass =
  'pointer-events-none absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-brand-paper/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-brand-blue';
