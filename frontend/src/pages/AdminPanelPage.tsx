/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  adminInsightsApi,
  adminPanelApi,
  type SurveyResults,
  type UsageAnalytics,
  type PendingPromotion,
  type ProviderOption,
  type Statistics,
} from '../services/adminPanelApi';
import { CalendarIcon, CompassIcon, HeartIcon, MapIcon, PinIcon, SearchIcon } from '../components/brand/icons';
import {
  ChartIcon,
  ChatIcon,
  CheckCircleIcon,
  ExternalIcon,
  EyeIcon,
  FileIcon,
  InboxIcon,
  LinkIcon,
  PhoneIcon,
  ShareIcon,
  StarIcon,
  StoreIcon,
  TagIcon,
  TargetIcon,
  UsersIcon,
} from '../components/admin/AdminIcons';
import {
  BarChart,
  EmptyState,
  GoalMeter,
  GoalStatus,
  KpiTile,
  MeterTrack,
  Notice,
  PageHeader,
  PanelCard,
  SectionHeading,
  StatFiller,
  StatGrid,
  StatusPill,
} from '../components/admin/AdminUi';
import { fieldLabel, panelSurface, quietAccent, quietButton, quietDanger, quietGhost, tabClass } from '../components/admin/classes';
import { formatNumber, statusOf } from '../components/admin/status';

// Sólo aceptamos respuestas con la forma esperada (evita pantallas en blanco si la API cambia o falla).
const isSurveyResults = (value: unknown): value is SurveyResults =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'metas' in value;
const isUsageAnalytics = (value: unknown): value is UsageAnalytics =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'totales' in value;
const isStatistics = (value: unknown): value is Statistics =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'totales' in value
  && typeof (value as Statistics).totales === 'object' && (value as Statistics).totales !== null;
const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });
const longDate = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
const timeFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' });
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Mexico_City' }).format(new Date()));
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const sections = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'validacion', label: 'Validación' },
  { id: 'uso', label: 'Uso' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'promociones', label: 'Promociones' },
  { id: 'prestadores', label: 'Prestadores' },
] as const;

const useActiveSection = () => {
  const [active, setActive] = useState<string>(sections[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return active;
};

const SectionNav = ({ pendingCount }: { pendingCount: number }) => {
  const active = useActiveSection();
  return (
    <nav aria-label="Secciones del panel" className="sticky top-[72px] z-[900] -mx-5 mt-10 border-b border-brand-sand bg-brand-paper px-5 sm:mx-0 sm:px-0">
      <ul className="flex gap-5 overflow-x-auto [scrollbar-width:none] sm:gap-8">
        {sections.map(({ id, label }) => {
          const current = active === id;
          return (
            <li key={id} className="shrink-0">
              <a href={`#${id}`} aria-current={current ? 'true' : undefined} className={tabClass(current)}>
                {label}
                {id === 'promociones' && pendingCount > 0 && (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full border border-brand-gold/50 px-1 text-[10.5px] font-medium tabular-nums text-brand-gold">
                    {pendingCount}
                    <span className="sr-only"> pendientes</span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const AdminPanelPage = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [pending, setPending] = useState<PendingPromotion[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [survey, setSurvey] = useState<SurveyResults | null>(null);
  const [usage, setUsage] = useState<UsageAnalytics | null>(null);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const [statsResponse, pendingResponse, providersResponse] = await Promise.all([
        adminPanelApi.statistics(token),
        adminPanelApi.pendingPromotions(token),
        adminPanelApi.providers(token),
      ]);
      setStats(isStatistics(statsResponse?.data) ? statsResponse.data : null);
      setPending(asArray<PendingPromotion>(pendingResponse?.data));
      setProviders(asArray<ProviderOption>(providersResponse?.data));
      // Validación y analítica: si las tablas aún no existen (migración 013) no se bloquea el panel.
      adminInsightsApi.survey(token).then((response) => setSurvey(isSurveyResults(response.data) ? response.data : null)).catch(() => setSurvey(null));
      adminInsightsApi.usage(token).then((response) => setUsage(isUsageAnalytics(response.data) ? response.data : null)).catch(() => setUsage(null));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const review = async (promotion: PendingPromotion, state: 'aprobado' | 'rechazado') => {
    if (!token) return;
    try {
      await adminPanelApi.reviewPromotion(token, promotion.id, state, reasons[promotion.id]);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible revisar la promoción.');
    }
  };

  const firstName = user?.nombre?.split(' ')[0];

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8" aria-busy="true">
        <p className="sr-only">Cargando panel…</p>
        <div className="h-3 w-32 animate-pulse rounded-full bg-brand-sand" />
        <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded-lg bg-brand-sand/70" />
        <div className="mt-12 h-px bg-brand-sand" />
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-brand-sand bg-brand-sand md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse bg-white" />)}
        </div>
      </section>
    );
  }

  const t = stats?.totales;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        eyebrow="Administración"
        title="Panel de XploraSG"
        meta={<>{greeting()}{firstName ? `, ${firstName}` : ''} · {capitalize(longDate.format(now))}</>}
        actions={
          <>
            <Link to="/admin/contenido" className={quietButton}>
              <FileIcon className="size-4" /> Revisar contenido
            </Link>
            <Link to="/admin/agenda" className={quietButton}>
              <CalendarIcon className="size-4" /> Agenda
            </Link>
            <Link to="/" className={quietGhost}>
              <ExternalIcon className="size-4" /> Ver sitio
            </Link>
          </>
        }
      />

      <SectionNav pendingCount={pending.length} />

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {/* Resumen */}
      <section id="resumen" aria-labelledby="resumen-title" className="scroll-mt-32 pt-10">
        <SectionHeading
          id="resumen-title"
          title="Resumen"
          description={stats ? <>Indicadores del catálogo · actualizado {timeFormatter.format(new Date(stats.generadoEn))}</> : 'Indicadores del catálogo y tareas pendientes de revisión.'}
        />
        {t ? (
          <StatGrid className="mt-8 grid-cols-2 lg:grid-cols-4">
            <KpiTile icon={PinIcon} label="Lugares publicados" value={t.lugares}
              note={t.lugares >= 20 ? 'Meta del proyecto (20) cumplida' : `Meta del proyecto: 20 · faltan ${20 - t.lugares}`} noteTone={t.lugares >= 20 ? 'ok' : 'muted'} />
            <KpiTile icon={StoreIcon} label="Servicios publicados" value={t.servicios}
              note={t.servicios >= 15 ? 'Meta del proyecto (15) cumplida' : `Meta del proyecto: 15 · faltan ${15 - t.servicios}`} noteTone={t.servicios >= 15 ? 'ok' : 'muted'} />
            <KpiTile icon={CalendarIcon} label="Eventos próximos" value={t.eventos_proximos} />
            <KpiTile icon={TagIcon} label="Promociones activas" value={t.promociones_activas}
              note={t.promociones_pendientes ? `${t.promociones_pendientes} en revisión` : 'Sin pendientes'} noteTone={t.promociones_pendientes ? 'warn' : 'muted'} />
            <KpiTile icon={UsersIcon} label="Prestadores" value={t.prestadores} />
            <KpiTile icon={CompassIcon} label="Usuarios registrados" value={t.usuarios} />
            <KpiTile icon={HeartIcon} label="Favoritos guardados" value={t.favoritos} />
            <KpiTile icon={MapIcon} label="Lugares sin coordenadas" value={t.lugares_sin_coordenadas}
              note={t.lugares_sin_coordenadas ? 'Pendientes de ubicar en el mapa' : 'Todos ubicados en el mapa'} noteTone={t.lugares_sin_coordenadas ? 'warn' : 'ok'} />
          </StatGrid>
        ) : (
          <div className="mt-8"><EmptyState icon={ChartIcon} title="Sin indicadores disponibles" text="No se recibieron estadísticas del catálogo. Intenta recargar la página." /></div>
        )}
      </section>

      <ValidationSection survey={survey} />
      <UsageSection usage={usage} />

      {/* Catálogo */}
      <section id="catalogo" aria-labelledby="catalogo-title" className="mt-14 scroll-mt-32 border-t border-brand-sand pt-12">
        <SectionHeading id="catalogo-title" eyebrow="Contenido" title="Catálogo publicado" description="Distribución de lugares y servicios aprobados por municipio y categoría." />
        {stats ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Publicaciones por municipio"
              subtitle="Lugares y servicios aprobados"
              series={['Lugares', 'Servicios']}
              unit="publicaciones"
              rows={asArray<Statistics['porMunicipio'][number]>(stats.porMunicipio).map((row) => ({ label: row.municipio, values: [row.lugares, row.servicios] }))}
            />
            <BarChart
              title="Lugares por categoría"
              series={['Lugares']}
              unit="lugares"
              rows={asArray<Statistics['porCategoria'][number]>(stats.porCategoria).map((row) => ({ label: row.categoria, values: [row.lugares] }))}
            />
            <BarChart
              title="Lugares favoritos de los turistas"
              subtitle="Veces guardado en favoritos"
              series={['Favoritos']}
              unit="favoritos"
              emptyText="Aún no hay favoritos guardados."
              rows={asArray<Statistics['topFavoritos'][number]>(stats.topFavoritos).map((row) => ({ label: row.nombre, values: [row.favoritos], to: `/lugares/${row.slug}` }))}
            />
            <BarChart
              title="Usuarios por rol"
              series={['Usuarios']}
              unit="usuarios"
              rows={asArray<Statistics['usuariosPorRol'][number]>(stats.usuariosPorRol).map((row) => ({ label: capitalize(String(row.rol)), values: [row.usuarios] }))}
            />
          </div>
        ) : (
          <div className="mt-8"><EmptyState icon={ChartIcon} title="Sin datos del catálogo" /></div>
        )}
      </section>

      {/* Promociones */}
      <section id="promociones" aria-labelledby="promociones-title" className="mt-14 scroll-mt-32 border-t border-brand-sand pt-12">
        <SectionHeading
          id="promociones-title"
          eyebrow="Moderación"
          title="Promociones por revisar"
          description="Las promociones aprobadas aparecen en la Agenda. Para rechazar escribe el motivo: el prestador lo verá en su panel."
          action={<StatusPill tone={pending.length ? 'teal' : 'green'} label={pending.length ? `${pending.length} pendiente${pending.length === 1 ? '' : 's'}` : 'Al día'} />}
        />
        <div className="mt-8">
          {pending.length ? (
            <ul className={`${panelSurface} divide-y divide-brand-sand overflow-hidden`}>
              {pending.map((promotion) => (
                <li key={promotion.id} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-8">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <h3 className="text-[15px] font-medium leading-6 text-brand-blue">{promotion.titulo}</h3>
                      <StatusPill {...statusOf('en_revision')} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-brand-blue/70">
                      {promotion.prestador ?? 'Sin prestador'}{promotion.servicio_nombre ? ` · ${promotion.servicio_nombre}` : ''} ·{' '}
                      {dateFormatter.format(new Date(promotion.fecha_inicio))} – {dateFormatter.format(new Date(promotion.fecha_fin))}
                    </p>
                    {promotion.descripcion && <p className="mt-2.5 max-w-prose text-sm leading-6 text-brand-blue/80">{promotion.descripcion}</p>}
                    {promotion.condiciones && <p className="mt-1 text-xs leading-5 text-brand-blue/70">Condiciones: {promotion.condiciones}</p>}
                  </div>
                  <div className="grid content-start gap-2.5">
                    <label className="sr-only" htmlFor={`motivo-${promotion.id}`}>Motivo de rechazo para {promotion.titulo}</label>
                    <input
                      id={`motivo-${promotion.id}`}
                      value={reasons[promotion.id] ?? ''}
                      onChange={(event) => setReasons((current) => ({ ...current, [promotion.id]: event.target.value }))}
                      placeholder="Motivo (obligatorio para rechazar)"
                      className="field min-h-10 py-2"
                    />
                    <div className="flex gap-2 sm:justify-end">
                      <button type="button" onClick={() => review(promotion, 'rechazado')} className={`${quietDanger} flex-1 sm:flex-none`}>
                        Rechazar
                      </button>
                      <button type="button" onClick={() => review(promotion, 'aprobado')} className={`${quietAccent} flex-1 sm:flex-none`}>
                        <CheckCircleIcon className="size-4" /> Aprobar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={InboxIcon} title="No hay promociones pendientes" text="Cuando un prestador envíe una promoción aparecerá aquí para su revisión." />
          )}
        </div>
      </section>

      {/* Prestadores */}
      <section id="prestadores" aria-labelledby="prestadores-title" className="mt-14 scroll-mt-32 border-t border-brand-sand pt-12">
        <SectionHeading id="prestadores-title" eyebrow="Negocios locales" title="Prestadores" description="Negocios registrados y la cuenta que puede administrar cada uno desde «Mi negocio»." />
        <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <ProvidersTable providers={providers} />
          <LinkProviderForm providers={providers} token={token} onLinked={load} />
        </div>
      </section>
    </section>
  );
};

const ProvidersTable = ({ providers }: { providers: ProviderOption[] }) => (
  <PanelCard flush title="Directorio de prestadores" subtitle={`${providers.length} registrados · ${providers.filter((provider) => provider.usuario_email).length} con cuenta vinculada`}>
    {providers.length ? (
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead>
            <tr className="border-y border-brand-sand text-[11px] uppercase tracking-[0.08em] text-brand-blue/70">
              <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Negocio</th>
              <th scope="col" className="hidden w-32 px-3 py-2.5 font-medium sm:table-cell">Estado</th>
              <th scope="col" className="hidden w-[32%] px-5 py-2.5 font-medium sm:table-cell sm:px-6">Cuenta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand/80">
            {providers.map((provider) => (
              <tr key={provider.id} className="transition-colors hover:bg-brand-paper">
                <th scope="row" className="px-5 py-3 font-normal sm:px-6">
                  <span className="flex min-w-0 items-start gap-3 sm:items-center" title={provider.nombre_comercial}>
                    <span className="font-display grid size-8 shrink-0 place-items-center rounded-full bg-brand-light text-sm text-brand-blue" aria-hidden="true">
                      {provider.nombre_comercial.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="grid min-w-0">
                      <span className="text-brand-blue sm:truncate">{provider.nombre_comercial}</span>
                      <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
                        <StatusPill {...statusOf(provider.estado_aprobacion)} />
                        <span className="min-w-0 truncate text-xs text-brand-blue/70">{provider.usuario_email ?? 'Sin cuenta'}</span>
                      </span>
                    </span>
                  </span>
                </th>
                <td className="hidden px-3 py-3 sm:table-cell"><StatusPill {...statusOf(provider.estado_aprobacion)} /></td>
                <td className="hidden px-5 py-3 text-xs sm:table-cell sm:px-6">
                  {provider.usuario_email
                    ? <span className="flex min-w-0 items-center gap-1.5 text-brand-blue/80" title={provider.usuario_email}><LinkIcon className="size-3.5 shrink-0 text-brand-teal" /><span className="truncate">{provider.usuario_email}</span></span>
                    : <span className="text-brand-blue/70">Sin cuenta</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="px-5 pb-5 sm:px-6 sm:pb-6"><EmptyState compact icon={StoreIcon} title="Aún no hay prestadores registrados" /></div>
    )}
  </PanelCard>
);

const LinkProviderForm = ({ providers, token, onLinked }: { providers: ProviderOption[]; token: string | null; onLinked: () => Promise<void> }) => {
  const [providerId, setProviderId] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !providerId) return;
    setSending(true);
    setMessage(null);
    try {
      await adminPanelApi.linkProvider(token, providerId, email);
      setMessage({ tone: 'ok', text: `Listo: ${email} ya puede entrar a "Mi negocio".` });
      setEmail('');
      await onLinked();
    } catch (requestError) {
      setMessage({ tone: 'error', text: requestError instanceof Error ? requestError.message : 'No fue posible vincular la cuenta.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-xl border border-brand-sand bg-brand-light/45 p-5 sm:p-6" aria-labelledby="vincular-title">
      <h3 id="vincular-title" className="font-display text-xl font-normal text-brand-blue">Vincular cuenta de prestador</h3>
      <p className="mt-2 text-[13px] leading-6 text-brand-blue/75">
        El prestador primero se registra en XploraSG. Después, elige su negocio y escribe su correo: su cuenta pasará a rol prestador y podrá editar sus servicios y publicar promociones.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Negocio</span>
          <select required value={providerId} onChange={(event) => setProviderId(Number(event.target.value))} className="field">
            <option value={0} disabled>Selecciona un prestador…</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.nombre_comercial}{provider.usuario_email ? ` (${provider.usuario_email})` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Correo de la cuenta</span>
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prestador@correo.com" className="field" />
        </label>
        <button type="submit" disabled={sending || !providerId} className="btn btn-primary w-full">
          <LinkIcon className="size-4" /> {sending ? 'Vinculando…' : 'Vincular cuenta'}
        </button>
      </form>
      {message && <Notice tone={message.tone} className="mt-4">{message.text}</Notice>}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Metas del Anexo 1: respuestas ≥ 50, aceptación ≥ 85 %, satisfacción ≥ 80 %, reducción de tiempo ≥ 40 %
// ---------------------------------------------------------------------------
const moduleLabels: Record<string, string> = {
  mapa: 'Mapa', asistente: 'Chatboot', catalogo: 'Catálogo', agenda: 'Agenda', rutas: 'Rutas', favoritos: 'Favoritos',
};

const ResponsesProgress = ({ count, goal }: { count: number; goal: number }) => {
  const safeGoal = goal > 0 ? goal : 50;
  const reached = count >= safeGoal;
  const fill = Math.min(1, count / safeGoal);
  return (
    <div className="flex min-w-0 flex-col bg-white p-5 sm:p-6 md:col-span-3 lg:col-span-2">
      <p className="text-[13px] font-medium text-brand-blue/80">Respuestas recolectadas</p>
      <p className="text-[11.5px] leading-4 text-brand-blue/70">Encuesta pública de validación</p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[3rem] font-normal leading-none tracking-[-0.02em] text-brand-blue">{formatNumber(count)}</span>
        <span className="text-sm text-brand-blue/70">de {safeGoal} necesarias</span>
      </p>
      <div className="mt-5" role="progressbar" aria-label="Respuestas recolectadas" aria-valuemin={0} aria-valuemax={safeGoal} aria-valuenow={count}>
        <MeterTrack fill={fill} reached={reached} />
        <div className="mt-2 flex justify-between text-[10.5px] tabular-nums text-brand-blue/70" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((step) => <span key={step}>{Math.round(step * safeGoal)}</span>)}
        </div>
      </div>
      <div className="mt-auto grid gap-1 pt-4">
        <GoalStatus state={reached ? 'ok' : 'below'}>{reached ? 'Muestra completa' : `Faltan ${safeGoal - count} respuestas`}</GoalStatus>
        <p className="text-xs leading-5 text-brand-blue/70">
          Comparte la encuesta pública en <Link to="/encuesta" className="font-medium text-brand-green underline underline-offset-2">/encuesta</Link> con turistas, prestadores y estudiantes.
        </p>
      </div>
    </div>
  );
};

const AverageScale = ({ label, value }: { label: string; value: number | null | undefined }) => {
  const has = typeof value === 'number' && Number.isFinite(value);
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
      <span className="text-[13px] text-brand-blue/75">{label}</span>
      <span className="text-sm font-medium tabular-nums text-brand-blue">{has ? value.toFixed(1) : '—'}<span className="text-xs font-normal text-brand-blue/70"> / 5</span></span>
      <span className="col-span-2 h-1.5 rounded-[4px] bg-brand-green/12" aria-hidden="true">
        <span className="block h-1.5 rounded-[4px] bg-[#2E7D4E]" style={{ width: `${has ? (value / 5) * 100 : 0}%` }} />
      </span>
    </li>
  );
};

const ValidationSection = ({ survey }: { survey: SurveyResults | null }) => {
  const comments = survey ? asArray<SurveyResults['comentarios'][number]>(survey.comentarios) : [];
  return (
    <section id="validacion" aria-labelledby="validacion-title" className="mt-14 scroll-mt-32 border-t border-brand-sand pt-12">
      <SectionHeading
        id="validacion-title"
        eyebrow="Anexo 1"
        title="Validación del proyecto"
        description="Metas de aceptación medidas con la encuesta pública. Cada medidor compara el resultado con su línea de meta."
      />
      {survey ? (
        <>
          <StatGrid className="mt-8 md:grid-cols-3 lg:grid-cols-5">
            <ResponsesProgress count={Number(survey.respuestas) || 0} goal={survey.metas?.respuestas ?? 50} />
            <GoalMeter label="Aceptación" hint="Recomendaría XploraSG" value={survey.aceptacion_pct} goal={survey.metas?.aceptacion_pct ?? 85} />
            <GoalMeter label="Satisfacción" hint="Calificación de 4 o 5" value={survey.satisfaccion_pct} goal={survey.metas?.satisfaccion_pct ?? 80} />
            <GoalMeter label="Reducción de tiempo" hint="Al planear la visita" value={survey.reduccion_tiempo_pct} goal={survey.metas?.reduccion_tiempo_pct ?? 40} />
          </StatGrid>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <PanelCard title="Promedios" subtitle="Escala de 1 a 5">
              <ul className="grid gap-4">
                <AverageScale label="Satisfacción" value={survey.satisfaccion_promedio} />
                <AverageScale label="Facilidad de uso" value={survey.facilidad_promedio} />
                <AverageScale label="Utilidad" value={survey.utilidad_promedio} />
              </ul>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-brand-sand pt-4">
                <div>
                  <dt className="text-[11.5px] text-brand-blue/70">Con otros medios</dt>
                  <dd className="mt-1 font-display text-2xl leading-none text-brand-blue">{survey.minutos_otros ?? '—'} <span className="font-sans text-xs text-brand-blue/70">min</span></dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-brand-blue/70">Con XploraSG</dt>
                  <dd className="mt-1 font-display text-2xl leading-none text-brand-blue">{survey.minutos_xplora ?? '—'} <span className="font-sans text-xs text-brand-blue/70">min</span></dd>
                </div>
              </dl>
            </PanelCard>
            <BarChart
              title="Perfil de participantes"
              series={['Respuestas']}
              unit="respuestas"
              rows={asArray<SurveyResults['perfiles'][number]>(survey.perfiles).map((row) => ({ label: capitalize(String(row.perfil)), values: [row.total] }))}
            />
            <BarChart
              title="Módulo favorito"
              series={['Respuestas']}
              unit="respuestas"
              rows={asArray<SurveyResults['modulos'][number]>(survey.modulos).map((row) => ({ label: moduleLabels[row.modulo] ?? capitalize(String(row.modulo)), values: [row.total] }))}
            />
          </div>
          <div className="mt-4">
            <PanelCard title="Comentarios recientes" subtitle="Últimos comentarios con su calificación">
              {comments.length ? (
                <ul className="grid gap-x-8 md:grid-cols-2">
                  {comments.map((row, index) => (
                    <li key={`${row.created_at}-${index}`} className="flex gap-3 border-t border-brand-sand py-3.5 first:border-t-0 md:[&:nth-child(2)]:border-t-0">
                      <span className="mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-brand-sand px-2 text-[11px] font-medium tabular-nums text-brand-blue" aria-label={`Calificación ${row.satisfaccion} de 5`}>
                        <StarIcon className="size-3 text-brand-gold" />{row.satisfaccion}/5
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-brand-blue/85">“{row.comentario}”</p>
                        <p className="text-[11px] text-brand-blue/70">{dateFormatter.format(new Date(row.created_at))}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact icon={ChatIcon} title="Aún no hay comentarios" />}
            </PanelCard>
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={TargetIcon}
            title="No se pudieron cargar los resultados"
            text={<>Verifica que la migración <code className="rounded bg-white px-1">013_validacion_y_analitica.sql</code> esté aplicada en Supabase.</>}
          />
        </div>
      )}
    </section>
  );
};

const usageLabels: Record<string, { label: string; icon: typeof EyeIcon }> = {
  vista_lugar: { label: 'Vistas de lugares', icon: EyeIcon },
  vista_servicio: { label: 'Vistas de servicios', icon: StoreIcon },
  clic_whatsapp: { label: 'Clics a WhatsApp', icon: PhoneIcon },
  busqueda: { label: 'Búsquedas', icon: SearchIcon },
  consulta_asistente: { label: 'Preguntas a Chatboot', icon: ChatIcon },
  ruta: { label: 'Rutas trazadas', icon: MapIcon },
  compartir: { label: 'Veces compartido', icon: ShareIcon },
};

const UsageSection = ({ usage }: { usage: UsageAnalytics | null }) => {
  const totals: Record<string, number> = usage && typeof usage.totales === 'object' && usage.totales ? usage.totales : {};
  const grandTotal = Object.values(totals).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return (
    <section id="uso" aria-labelledby="uso-title" className="mt-14 scroll-mt-32 border-t border-brand-sand pt-12">
      <SectionHeading
        id="uso-title"
        eyebrow="Analítica"
        title="Uso de la plataforma"
        description="Interacciones registradas en los últimos 30 días."
        action={usage ? <span className="inline-flex items-center gap-1.5 text-[13px] text-brand-blue/75"><ChartIcon className="size-4 text-brand-teal" /><b className="font-medium text-brand-blue">{formatNumber(grandTotal)}</b> interacciones</span> : undefined}
      />
      {usage ? (
        <>
          <StatGrid className="mt-8 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(usageLabels).map(([key, { label, icon }]) => (
              <KpiTile key={key} size="sm" icon={icon} label={label} value={Number(totals[key]) || 0} />
            ))}
            <StatFiller className="lg:hidden" />
          </StatGrid>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Lugares más vistos"
              subtitle="Vistas de ficha"
              series={['Vistas']}
              unit="vistas"
              rows={asArray<UsageAnalytics['lugaresMasVistos'][number]>(usage.lugaresMasVistos).map((row) => ({ label: row.nombre, values: [row.total], to: row.slug ? `/lugares/${row.slug}` : null }))}
            />
            <BarChart
              title="Servicios más contactados"
              subtitle="Clics a WhatsApp"
              series={['Clics']}
              unit="clics"
              rows={asArray<UsageAnalytics['serviciosMasContactados'][number]>(usage.serviciosMasContactados).map((row) => ({ label: row.nombre, values: [row.total], to: row.slug ? `/servicios/${row.slug}` : null }))}
            />
            <BarChart
              title="Búsquedas frecuentes"
              subtitle="Términos escritos en el buscador"
              series={['Búsquedas']}
              unit="búsquedas"
              rows={asArray<UsageAnalytics['busquedasFrecuentes'][number]>(usage.busquedasFrecuentes).map((row) => ({ label: `“${row.termino}”`, values: [row.total] }))}
            />
            <BarChart
              title="Interacciones por tipo"
              series={['Interacciones']}
              unit="interacciones"
              rows={Object.entries(usageLabels)
                .map(([key, { label }]) => ({ label, values: [Number(totals[key]) || 0] }))
                .filter((row) => row.values[0] > 0)
                .sort((a, b) => b.values[0] - a.values[0])}
            />
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState icon={ChartIcon} title="Sin analítica disponible" text="Los datos de uso aparecerán cuando la migración de analítica esté aplicada y haya visitas registradas." />
        </div>
      )}
    </section>
  );
};
