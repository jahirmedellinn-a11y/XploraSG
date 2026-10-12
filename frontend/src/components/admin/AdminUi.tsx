// Piezas de interfaz para los paneles de administración y prestador (v3 · Editorial natural):
// superficies planas con filete beige, títulos en Fraunces, cifras en serif, pestañas subrayadas,
// medidores delgados con marca de meta y gráficas de barras finas con valor en tinta + «Ver tabla».
import { useId, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { AlertIcon, CheckCircleIcon, ClockIcon, DraftIcon, MinusCircleIcon, PauseCircleIcon, XCircleIcon } from './AdminIcons';
import { panelSurface } from './classes';
import { SERIES_COLORS, formatNumber, type PillTone } from './status';

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

// ---------------------------------------------------------------------------
// Estado (pill): icono + texto; el color nunca va solo.
// ---------------------------------------------------------------------------
const pillTone: Record<PillTone, { box: string; icon: string; Icon: Icon }> = {
  green: { box: 'border-brand-green/25 bg-brand-green/[0.07] text-brand-green', icon: 'text-brand-green', Icon: CheckCircleIcon },
  teal: { box: 'border-brand-teal/35 bg-brand-teal/10 text-brand-blue/85', icon: 'text-brand-teal', Icon: ClockIcon },
  gold: { box: 'border-brand-gold/55 bg-white text-brand-gold', icon: 'text-brand-gold', Icon: DraftIcon },
  red: { box: 'border-clay-200 bg-clay-50 text-clay-800', icon: 'text-clay-600', Icon: XCircleIcon },
  amber: { box: 'border-ochre-200 bg-ochre-50 text-ochre-900', icon: 'text-ochre-600', Icon: PauseCircleIcon },
  blue: { box: 'border-brand-sand bg-brand-paper text-brand-blue/70', icon: 'text-brand-blue/70', Icon: MinusCircleIcon },
};

export const StatusPill = ({ tone, label, className = '' }: { tone: PillTone; label: string; className?: string }) => {
  const t = pillTone[tone];
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border pl-1.5 pr-2.5 text-[11.5px] font-medium ${t.box} ${className}`}>
      <t.Icon className={`size-3.5 ${t.icon}`} />
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Encabezado de página
// ---------------------------------------------------------------------------
export const PageHeader = ({ eyebrow, title, meta, actions, before }: { eyebrow?: string; title: ReactNode; meta?: ReactNode; actions?: ReactNode; before?: ReactNode }) => (
  <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      {before}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="font-display mt-3 text-[2.125rem] font-normal leading-[1.08] tracking-[-0.02em] text-brand-blue sm:text-[2.75rem]">{title}</h1>
      {meta && <div className="mt-3 text-sm leading-6 text-brand-blue/70">{meta}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/** Enlace de regreso discreto sobre el encabezado. */
export const BackLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="mb-7 flex w-fit items-center gap-1.5 text-[13px] text-brand-blue/70 transition-colors hover:text-brand-blue">
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    {children}
  </Link>
);

// ---------------------------------------------------------------------------
// Avisos (error / confirmación)
// ---------------------------------------------------------------------------
export const Notice = ({ tone, children, className = '' }: { tone: 'ok' | 'error'; children: ReactNode; className?: string }) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${tone === 'ok' ? 'border-brand-green/25 bg-brand-green/[0.06] text-brand-blue' : 'border-clay-200 bg-clay-50 text-clay-800'} ${className}`}
  >
    {tone === 'ok' ? <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-green" /> : <AlertIcon className="mt-0.5 size-4 shrink-0 text-clay-600" />}
    <span className="min-w-0">{children}</span>
  </p>
);

// ---------------------------------------------------------------------------
// Tarjeta de panel con encabezado
// ---------------------------------------------------------------------------
export const PanelCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  flush = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** El contenido llega hasta los bordes (tablas, listas con filetes). */
  flush?: boolean;
}) => (
  <section className={`${panelSurface} flex min-w-0 flex-col ${className}`}>
    <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-medium leading-6 text-brand-blue">{title}</h3>
        {subtitle && <p className="text-xs leading-5 text-brand-blue/70">{subtitle}</p>}
      </div>
      {action}
    </header>
    <div className={`flex-1 ${flush ? 'mt-4' : 'mt-5 px-5 pb-5 sm:px-6 sm:pb-6'}`}>{children}</div>
  </section>
);

// ---------------------------------------------------------------------------
// Encabezado de sección del panel
// ---------------------------------------------------------------------------
export const SectionHeading = ({ id, eyebrow, title, description, action }: { id?: string; eyebrow?: string; title: string; description?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 id={id} className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-brand-blue sm:text-[2rem]">{title}</h2>
      {description && <p className="mt-2 text-sm leading-6 text-brand-blue/70">{description}</p>}
    </div>
    {action}
  </div>
);

// ---------------------------------------------------------------------------
// Cifras: rejilla con filetes y fichas de dato (número en serif)
// ---------------------------------------------------------------------------
/** Rejilla de fichas separadas por filetes de 1px (el fondo beige asoma por el hueco). */
export const StatGrid = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <dl className={`grid gap-px overflow-hidden rounded-xl border border-brand-sand bg-brand-sand ${className}`}>{children}</dl>
);

/** Celda vacía para completar la última fila de una StatGrid. */
export const StatFiller = ({ className = '' }: { className?: string }) => <div className={`bg-white ${className}`} aria-hidden="true" />;

export const KpiTile = ({
  label,
  value,
  note,
  icon: IconComponent,
  noteTone = 'muted',
  size = 'md',
}: {
  label: string;
  value: number | string;
  note?: ReactNode;
  icon?: Icon;
  noteTone?: 'muted' | 'warn' | 'ok';
  size?: 'sm' | 'md';
}) => (
  <div className={`flex min-w-0 flex-col bg-white ${size === 'sm' ? 'gap-2 p-4' : 'gap-3 p-4 sm:p-5'}`}>
    <dt className={`flex items-start gap-1.5 text-[12.5px] leading-5 text-brand-blue/70 ${size === 'md' ? 'min-h-10 sm:min-h-0' : ''}`}>
      {IconComponent && <IconComponent className="mt-[3px] size-3.5 shrink-0 text-brand-teal" />}
      <span className="min-w-0">{label}</span>
    </dt>
    <dd className={`font-display font-normal leading-none tracking-[-0.02em] text-brand-blue ${size === 'sm' ? 'mt-auto text-[1.75rem]' : 'text-[2.25rem]'}`}>
      {typeof value === 'number' ? formatNumber(value) : value}
    </dd>
    {note && (
      <dd className={`flex items-start gap-1 text-xs leading-5 ${noteTone === 'warn' ? 'text-ochre-800' : noteTone === 'ok' ? 'text-brand-green' : 'text-brand-blue/70'}`}>
        {noteTone === 'warn' && <AlertIcon className="mt-[3px] size-3 shrink-0 text-ochre-600" />}
        {noteTone === 'ok' && <CheckCircleIcon className="mt-[3px] size-3 shrink-0" />}
        <span className="min-w-0">{note}</span>
      </dd>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Estado vacío
// ---------------------------------------------------------------------------
export const EmptyState = ({ icon: IconComponent, title, text, action, compact = false }: { icon: Icon; title: string; text?: ReactNode; action?: ReactNode; compact?: boolean }) => (
  <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-blue/15 bg-brand-light/35 text-center ${compact ? 'px-4 py-7' : 'px-6 py-12'}`}>
    <IconComponent className="size-5 text-brand-teal" />
    <p className="mt-3 text-sm font-medium text-brand-blue">{title}</p>
    {text && <p className="mt-1 max-w-sm text-xs leading-5 text-brand-blue/70">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Barras horizontales (1 o 2 series). Marcas finas, extremo de 4px, valor en tinta.
// ---------------------------------------------------------------------------
export interface BarRow { label: string; values: number[]; to?: string | null }

const VALUE_GUTTER = '2.5rem';

export const BarChart = ({
  title,
  subtitle,
  series,
  rows,
  unit,
  emptyText = 'Sin datos todavía.',
  className = '',
}: {
  title: string;
  subtitle?: string;
  series: string[];
  rows: BarRow[];
  unit: string;
  emptyText?: string;
  className?: string;
}) => {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const safeRows = rows.filter((row) => row && typeof row.label === 'string');
  const max = Math.max(1, ...safeRows.flatMap((row) => row.values.map((value) => Number(value) || 0)));
  const multi = series.length > 1;
  const legend = multi ? (
    <ul className="-mt-1 mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-blue/70" aria-label="Leyenda">
      {series.map((name, index) => (
        <li key={name} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2.5 rounded-[2px]" style={{ background: SERIES_COLORS[index] }} aria-hidden="true" />
          {name}
        </li>
      ))}
    </ul>
  ) : undefined;

  return (
    <PanelCard title={title} subtitle={subtitle} className={className}>
      {!safeRows.length ? (
        <EmptyState compact icon={MinusCircleIcon} title={emptyText} />
      ) : (
        <>
          {legend}
          <ul className="grid gap-3" onMouseLeave={() => setActive(null)}>
            {safeRows.map((row, rowIndex) => {
              const values = series.map((_, index) => Number(row.values[index]) || 0);
              const summary = series.map((name, index) => `${multi ? `${name}: ` : ''}${formatNumber(values[index])} ${unit}`).join(' · ');
              const peak = Math.max(...values) / max;
              const dimmed = active !== null && active !== rowIndex;
              return (
                <li
                  key={`${row.label}-${rowIndex}`}
                  tabIndex={0}
                  aria-label={`${row.label}: ${summary}`}
                  onMouseEnter={() => setActive(rowIndex)}
                  onFocus={() => setActive(rowIndex)}
                  onBlur={() => setActive(null)}
                  className={`relative grid gap-1 rounded-md outline-offset-4 transition-opacity duration-200 sm:grid-cols-[minmax(5rem,34%)_1fr] sm:items-center sm:gap-4 ${dimmed ? 'opacity-50' : ''}`}
                >
                  <span className="min-w-0 truncate text-[13px] text-brand-blue/80" title={row.label}>
                    {row.to ? (
                      <Link to={row.to} tabIndex={-1} className="underline-offset-2 hover:text-brand-green hover:underline">{row.label}</Link>
                    ) : row.label}
                  </span>
                  <div className="relative">
                    {/* línea base */}
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-brand-blue/15" aria-hidden="true" />
                    <div className={`relative grid py-0.5 ${multi ? 'gap-0.5' : ''}`}>
                      {values.map((value, index) => (
                        <div key={series[index]} className={`flex items-center gap-2 ${multi ? 'h-3' : ''}`}>
                          <span
                            className={`block rounded-r-[4px] ${multi ? 'h-[7px]' : 'h-2'}`}
                            style={{
                              width: `calc((100% - ${VALUE_GUTTER}) * ${value / max})`,
                              minWidth: value ? 3 : 0,
                              background: SERIES_COLORS[index],
                            }}
                          />
                          <span className={`tabular-nums ${multi ? 'text-[11px] leading-3' : 'text-xs'} ${active === rowIndex ? 'font-medium text-brand-blue' : 'font-medium text-brand-blue/85'}`}>{formatNumber(value)}</span>
                        </div>
                      ))}
                    </div>
                    {active === rowIndex && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-[16rem] rounded-lg border border-brand-sand bg-white px-3 py-2 text-xs shadow-soft"
                        style={{ left: `calc((100% - ${VALUE_GUTTER}) * ${peak})`, transform: `translateX(-${Math.round(peak * 100)}%)` }}
                      >
                        <p className="truncate font-medium text-brand-blue">{row.label}</p>
                        {values.map((value, index) => (
                          <p key={series[index]} className="mt-1 flex items-center gap-2">
                            <span className="h-2 w-2.5 rounded-[2px]" style={{ background: SERIES_COLORS[index] }} aria-hidden="true" />
                            <b className="font-medium tabular-nums text-brand-blue">{formatNumber(value)}</b>
                            <span className="text-brand-blue/70">{multi ? series[index].toLowerCase() : unit}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <DataTable id={tableId} caption={title} columns={['Elemento', ...series.map((name) => (multi ? name : `Total (${unit})`))]} rows={safeRows.map((row) => [row.label, ...series.map((_, index) => formatNumber(Number(row.values[index]) || 0))])} />
        </>
      )}
    </PanelCard>
  );
};

/** Tabla accesible plegable que acompaña a cada gráfica. */
export const DataTable = ({ id, caption, columns, rows }: { id?: string; caption: string; columns: string[]; rows: Array<Array<string | number>> }) => (
  <details className="group mt-5 border-t border-brand-sand pt-3 text-xs">
    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md font-medium text-brand-blue/70 transition-colors hover:text-brand-blue [&::-webkit-details-marker]:hidden">
      <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      <span className="group-open:hidden">Ver tabla</span>
      <span className="hidden group-open:inline">Ocultar tabla</span>
    </summary>
    <div className="mt-3 overflow-x-auto">
      <table id={id} className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-brand-sand text-[11px] uppercase tracking-[0.08em] text-brand-blue/70">
            {columns.map((column, index) => <th key={column} scope="col" className={`py-2 pr-3 font-medium ${index ? 'text-right' : ''}`}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-brand-sand/70 last:border-0">
              {row.map((cell, index) => (
                index === 0
                  ? <th key={index} scope="row" className="py-2 pr-3 font-normal text-brand-blue/80">{cell}</th>
                  : <td key={index} className="py-2 pr-3 text-right tabular-nums text-brand-blue">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

// ---------------------------------------------------------------------------
// Medidor de meta: pista delgada, marca de meta en tinta, estado con icono + texto.
// ---------------------------------------------------------------------------
export const MeterTrack = ({ fill, target, reached, targetLabel }: { fill: number; target?: number; reached: boolean; targetLabel?: string }) => (
  <div className={`relative ${targetLabel ? 'pb-5' : ''}`} aria-hidden="true">
    <div className={`h-1.5 rounded-[4px] ${reached ? 'bg-brand-green/12' : 'bg-brand-gold/15'}`}>
      <div className={`h-1.5 rounded-[4px] transition-[width] duration-700 ${reached ? 'bg-[#2E7D4E]' : 'bg-brand-gold'}`} style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }} />
    </div>
    {typeof target === 'number' && (
      <>
        <span className="absolute -top-[5px] h-4 w-px -translate-x-1/2 bg-brand-blue" style={{ left: `${target * 100}%` }} />
        {targetLabel && (
          <span className="absolute top-3.5 -translate-x-1/2 whitespace-nowrap text-[10.5px] text-brand-blue/70" style={{ left: `${Math.min(88, Math.max(12, target * 100))}%` }}>
            {targetLabel}
          </span>
        )}
      </>
    )}
  </div>
);

export const GoalStatus = ({ state, children }: { state: 'none' | 'ok' | 'below'; children: ReactNode }) => {
  const s = state === 'none'
    ? { Icon: MinusCircleIcon, className: 'text-brand-blue/70', iconClass: 'text-brand-blue/70' }
    : state === 'ok'
      ? { Icon: CheckCircleIcon, className: 'text-brand-green', iconClass: 'text-brand-green' }
      : { Icon: AlertIcon, className: 'text-ochre-800', iconClass: 'text-ochre-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.className}`}>
      <s.Icon className={`size-3.5 ${s.iconClass}`} />
      {children}
    </span>
  );
};

export const GoalMeter = ({
  label,
  hint,
  value,
  goal,
  suffix = '%',
  scaleMax = 100,
}: {
  label: string;
  hint?: string;
  value: number | null | undefined;
  goal: number;
  suffix?: string;
  scaleMax?: number;
}) => {
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const reached = hasValue && value >= goal;
  const scale = Math.max(scaleMax, goal, hasValue ? value : 0) || 1;
  const fill = hasValue ? value / scale : 0;
  const target = Math.min(1, goal / scale);
  const gap = hasValue ? Math.round(Math.abs(value - goal) * 10) / 10 : null;

  return (
    <div className="flex min-w-0 flex-col bg-white p-5" title={`${label}: ${hasValue ? `${value}${suffix}` : 'sin datos'} · meta ${goal}${suffix}`}>
      <p className="text-[13px] font-medium text-brand-blue/80">{label}</p>
      {hint && <p className="text-[11.5px] leading-4 text-brand-blue/70">{hint}</p>}
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[2.25rem] font-normal leading-none tracking-[-0.02em] text-brand-blue">{hasValue ? `${value}${suffix}` : '—'}</span>
        <span className="text-xs text-brand-blue/70">meta ≥ {goal}{suffix}</span>
      </p>
      <div className="mt-5">
        <MeterTrack fill={fill} target={target} reached={reached} targetLabel={`Meta ${goal}${suffix}`} />
      </div>
      <div className="mt-auto grid gap-0.5 pt-3">
        <GoalStatus state={!hasValue ? 'none' : reached ? 'ok' : 'below'}>
          {!hasValue ? 'Sin datos' : reached ? 'Meta cumplida' : 'Por debajo de la meta'}
        </GoalStatus>
        <p className="text-xs text-brand-blue/70">
          {!hasValue ? 'Se calculará con las primeras respuestas.' : reached ? `Supera la meta por ${gap} pts.` : `Faltan ${gap} pts para la meta.`}
        </p>
      </div>
    </div>
  );
};
