import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  adminReviewApi,
  type ReviewItem,
  type ReviewKind,
  type ReviewState,
} from '../services/adminReviewApi';
import { categoryVisual } from '../components/brand/icons';
import { AlertIcon, CheckCircleIcon, ExternalIcon, InboxIcon } from '../components/admin/AdminIcons';
import { BackLink, EmptyState, Notice, PageHeader, StatusPill } from '../components/admin/AdminUi';
import {
  fieldLabel,
  filterChipClass,
  panelSurface,
  quietAccent,
  quietButton,
  quietDanger,
  quietGhost,
  tabClass,
} from '../components/admin/classes';
import { statusOf } from '../components/admin/status';

const stateLabels: Record<ReviewState, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

const updatedFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' });

export const AdminContentPage = () => {
  const { token } = useAuth();
  const [kind, setKind] = useState<ReviewKind>('lugar');
  const [state, setState] = useState<ReviewState | ''>('');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [rejecting, setRejecting] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await adminReviewApi.list(token, kind, state);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la bandeja editorial.');
    } finally {
      setLoading(false);
    }
  }, [kind, state, token]);

  // La bandeja depende de filtros remotos; el efecto inicia deliberadamente la carga.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const updateState = async (item: ReviewItem, nextState: ReviewState) => {
    if (!token) return;
    setSavingId(item.id);
    setError('');
    try {
      await adminReviewApi.update(token, item, nextState, reasons[item.id]);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible actualizar el contenido.');
    } finally {
      setSavingId(null);
    }
  };

  const ready = items.filter((item) => !item.faltantes.length).length;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        before={<BackLink to="/admin">Panel de administración</BackLink>}
        eyebrow="Administración editorial"
        title="Revisión de contenido"
        meta={<p className="max-w-3xl">Revisa borradores y controla su publicación. El sistema bloquea la aprobación cuando faltan coordenadas, fuente o multimedia pública autorizada.</p>}
      />

      {/* Barra de herramientas: tipo como pestañas subrayadas, estado como filtros */}
      <div className="mt-10 border-b border-brand-sand">
        <div className="flex gap-8" role="group" aria-label="Tipo de contenido">
          {(['lugar', 'servicio'] as ReviewKind[]).map((value) => (
            <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={tabClass(kind === value)}>
              {value === 'lugar' ? 'Lugares' : 'Servicios'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0" role="group" aria-label="Estado">
          {([['', 'Todos'], ...Object.entries(stateLabels)] as Array<[ReviewState | '', string]>).map(([value, label]) => {
            const selected = state === value;
            const tone = value ? statusOf(value).tone : null;
            return (
              <button key={value || 'todos'} type="button" aria-pressed={selected} onClick={() => setState(value)} className={filterChipClass(selected)}>
                {tone && <span className={`size-1.5 rounded-full ${selected ? 'bg-white' : dotClass[tone]}`} aria-hidden="true" />}
                {label}
              </button>
            );
          })}
        </div>
        {!loading && !error && (
          <p className="shrink-0 text-xs text-brand-blue/70" aria-live="polite">
            {items.length} {kind === 'lugar' ? (items.length === 1 ? 'lugar' : 'lugares') : (items.length === 1 ? 'servicio' : 'servicios')}
            {items.length > 0 && <> · {ready} listos para publicar</>}
          </p>
        )}
      </div>

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-xl border border-brand-sand bg-white" />)}</div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const visual = categoryVisual(item.categoria);
            const saving = savingId === item.id;
            const reason = reasons[item.id] || '';
            const publicPath = item.slug ? `/${item.tipo === 'lugar' ? 'lugares' : 'servicios'}/${item.slug}` : null;
            return (
              <article key={`${item.tipo}-${item.id}`} className={`${panelSurface} flex min-w-0 flex-col transition-opacity ${saving ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3.5 px-5 pt-5 sm:px-6">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-brand-light ${visual.tone}`}><visual.Icon className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <h2 className="min-w-0 font-sans text-[15px] font-medium leading-6 tracking-normal text-brand-blue">{item.nombre}</h2>
                      <StatusPill {...statusOf(item.estado, stateLabels)} />
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-brand-blue/70">
                      {item.municipio || 'Sin municipio'} · {item.categoria || 'Sin categoría'}
                      {item.updatedAt && <> · editado {updatedFormatter.format(new Date(item.updatedAt))}</>}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 sm:px-6">
                  {item.faltantes.length ? (
                    <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border border-ochre-200 bg-ochre-50/70 px-3 py-2 text-xs leading-5 text-ochre-900">
                      <AlertIcon className="size-3.5 shrink-0 text-ochre-600" />
                      <span className="font-medium">Falta para publicar:</span>
                      {item.faltantes.join(' · ')}
                    </p>
                  ) : (
                    <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand-green">
                      <CheckCircleIcon className="size-3.5" /> Listo para publicar
                    </p>
                  )}

                  {item.motivoRevision && <p className="mt-3 text-xs leading-5 text-brand-blue/75"><span className="font-medium text-brand-blue">Último motivo:</span> {item.motivoRevision}</p>}

                  {/* El motivo sólo aparece cuando se va a rechazar: tarjetas más limpias. */}
                  {rejecting[item.id] && (
                    <div className="animate-fade-up mt-4 grid gap-1.5">
                      <label className={fieldLabel} htmlFor={`reason-${item.id}`}>Motivo del rechazo (lo verá el equipo editorial)</label>
                      <textarea
                        id={`reason-${item.id}`}
                        value={reason}
                        autoFocus
                        onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                        rows={2}
                        className="field min-h-0 resize-y"
                        placeholder="Ej. Faltan coordenadas verificadas"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-brand-sand px-5 py-3.5 sm:px-6">
                  <button type="button" disabled={saving || item.faltantes.length > 0} onClick={() => void updateState(item, 'aprobado')} className={quietAccent}>
                    <CheckCircleIcon className="size-4" /> Aprobar
                  </button>
                  {item.estado !== 'en_revision' && (
                    <button type="button" disabled={saving} onClick={() => void updateState(item, 'en_revision')} className={quietButton}>
                      Enviar a revisión
                    </button>
                  )}
                  {rejecting[item.id] ? (
                    <>
                      <button type="button" disabled={saving || !reason.trim()} onClick={() => void updateState(item, 'rechazado')} className="btn min-h-9 bg-clay-700 px-4 py-1.5 !text-[13px] text-white hover:bg-clay-800">
                        Confirmar rechazo
                      </button>
                      <button type="button" onClick={() => setRejecting((current) => ({ ...current, [item.id]: false }))} className={quietGhost}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button type="button" disabled={saving} onClick={() => setRejecting((current) => ({ ...current, [item.id]: true }))} className={quietDanger}>
                      Rechazar
                    </button>
                  )}
                  {publicPath && item.estado === 'aprobado' && (
                    <Link to={publicPath} className="ml-auto inline-flex items-center gap-1 text-xs text-brand-blue/75 underline-offset-2 hover:text-brand-blue hover:underline">
                      Ver ficha <ExternalIcon className="size-3.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          {!items.length && (
            <div className="col-span-full">
              <EmptyState icon={InboxIcon} title="No hay contenido con estos filtros" text="Prueba con otro estado o cambia entre lugares y servicios." />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const dotClass: Record<string, string> = {
  green: 'bg-brand-green', teal: 'bg-brand-teal', gold: 'bg-brand-gold', red: 'bg-clay-600', amber: 'bg-ochre-500', blue: 'bg-brand-blue/50',
};
