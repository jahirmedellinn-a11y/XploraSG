// Estados de aprobación compartidos por los paneles (contenido, agenda, prestador).
export type PillTone = 'green' | 'teal' | 'gold' | 'red' | 'amber' | 'blue';

export const approvalStatus: Record<string, { label: string; tone: PillTone }> = {
  aprobado: { label: 'Aprobado', tone: 'green' },
  en_revision: { label: 'En revisión', tone: 'teal' },
  borrador: { label: 'Borrador', tone: 'gold' },
  rechazado: { label: 'Rechazado', tone: 'red' },
  suspendido: { label: 'Suspendido', tone: 'amber' },
};

export const statusOf = (state: string | null | undefined, labels?: Partial<Record<string, string>>) => {
  const key = state ?? '';
  const base = approvalStatus[key] ?? { label: key || 'Sin estado', tone: 'blue' as PillTone };
  return { ...base, label: labels?.[key] ?? base.label };
};

/**
 * Paleta de series validada para v3 (validador de dataviz):
 * una serie = bosque #2E7D4E; dos series = bosque + ocre #D69A5C.
 * El ocre queda por debajo de 3:1 sobre blanco: siempre con valor directo en tinta y vista de tabla.
 */
export const SERIES_COLORS = ['#2E7D4E', '#D69A5C'] as const;

const numberFormat = new Intl.NumberFormat('es-MX');
export const formatNumber = (value: number) => numberFormat.format(value);
