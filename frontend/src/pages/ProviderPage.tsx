/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  providerApi,
  type ApprovalState,
  type MyBusiness,
  type NewPromotion,
  type ProviderService,
  type ServiceChanges,
} from '../services/providerApi';
import { PinIcon } from '../components/brand/icons';
import { AlertIcon, ExternalIcon, MailIcon, PhoneIcon, StoreIcon, TagIcon, TrashIcon } from '../components/admin/AdminIcons';
import { EmptyState, KpiTile, Notice, PageHeader, SectionHeading, StatGrid, StatusPill } from '../components/admin/AdminUi';
import { fieldLabel, panelSurface } from '../components/admin/classes';
import { statusOf } from '../components/admin/status';

const stateLabel: Record<ApprovalState, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Publicado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

const StateChip = ({ state }: { state: ApprovalState }) => <StatusPill {...statusOf(state, stateLabel)} />;

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });
const updatedFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

const labelClass = `block ${fieldLabel}`;

export const ProviderPage = () => {
  const { token, user } = useAuth();
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const response = await providerApi.myBusiness(token);
      setBusiness(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar tu negocio.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8" aria-busy="true">
        <p className="sr-only">Cargando tu negocio…</p>
        <div className="h-3 w-32 animate-pulse rounded-full bg-brand-sand" />
        <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded-lg bg-brand-sand/70" />
        <div className="mt-10 h-24 animate-pulse rounded-xl border border-brand-sand bg-white" />
        <div className="mt-8 h-72 animate-pulse rounded-xl border border-brand-sand bg-white" />
      </section>
    );
  }

  const prestadores = Array.isArray(business?.prestadores) ? business.prestadores : [];
  const servicios = Array.isArray(business?.servicios) ? business.servicios : [];
  const promociones = Array.isArray(business?.promociones) ? business.promociones : [];
  const hasBusiness = prestadores.length > 0;
  const profile = prestadores[0];
  const activePromos = promociones.filter((promotion) => promotion.estado_aprobacion === 'aprobado' && new Date(promotion.fecha_fin).getTime() >= now).length;
  const inReview = promociones.filter((promotion) => promotion.estado_aprobacion === 'en_revision').length;
  const publishedServices = servicios.filter((service) => service.estado_aprobacion === 'aprobado').length;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        eyebrow="Panel del prestador"
        title={hasBusiness ? prestadores.map((p) => p.nombre_comercial).join(' · ') : 'Mi negocio'}
        meta={
          <>
            {hasBusiness && <div className="mb-3"><StatusPill {...statusOf(profile.estado_aprobacion, stateLabel)} /></div>}
            <p className="max-w-2xl">
              Hola, {user?.nombre?.split(' ')[0] || 'prestador'}. Aquí puedes mantener al día la información que ven los turistas y publicar promociones.
              No necesitas conocimientos técnicos: escribe, guarda y listo.
            </p>
            {hasBusiness && (profile.telefono || profile.correo) && (
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-brand-blue/70">
                {profile.telefono && <span className="inline-flex items-center gap-1.5"><PhoneIcon className="size-3.5 text-brand-teal" />{profile.telefono}</span>}
                {profile.correo && <span className="inline-flex min-w-0 items-center gap-1.5 break-all"><MailIcon className="size-3.5 shrink-0 text-brand-teal" />{profile.correo}</span>}
              </p>
            )}
          </>
        }
      />
      {hasBusiness && (
        <StatGrid className="mt-10 grid-cols-2 sm:grid-cols-4">
          <KpiTile size="sm" label="Servicios" value={servicios.length} />
          <KpiTile size="sm" label="Publicados" value={publishedServices} />
          <KpiTile size="sm" label="Promociones activas" value={activePromos} />
          <KpiTile size="sm" label="En revisión" value={inReview} noteTone={inReview ? 'warn' : 'muted'} note={inReview ? 'Esperando al equipo' : undefined} />
        </StatGrid>
      )}

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {!hasBusiness && !error && (
        <div className="mt-8">
          <EmptyState
            icon={StoreIcon}
            title="Tu cuenta todavía no está vinculada a un negocio"
            text={<>Pide al equipo de XploraSG que vincule tu correo ({user?.email}) con tu negocio desde el panel de administración.</>}
          />
        </div>
      )}

      {hasBusiness && business && (
        <>
          <section aria-labelledby="servicios-title" className="mt-14 border-t border-brand-sand pt-12">
            <SectionHeading id="servicios-title" title="Mis servicios" description="Lo que escribas aquí es lo que ven los turistas en tu ficha." />
          </section>
          <div className="mt-8 grid gap-5">
            {servicios.map((service) => (
              <ServiceEditor key={service.id} service={service} token={token!} onSaved={load} />
            ))}
            {!servicios.length && <EmptyState icon={StoreIcon} title="Aún no tienes servicios registrados" />}
          </div>

          <section aria-labelledby="promociones-title" className="mt-14 border-t border-brand-sand pt-12">
            <SectionHeading id="promociones-title" title="Mis promociones" description="Cada promoción pasa por una revisión rápida del equipo antes de aparecer en la Agenda." />
          </section>
          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
            <PromotionForm services={servicios} token={token!} onCreated={load} />
            <ul className={`${promociones.length ? `${panelSurface} divide-y divide-brand-sand overflow-hidden` : ''} grid content-start`}>
              {promociones.map((promotion) => (
                <li key={promotion.id} className="p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                        <h3 className="min-w-0 text-[15px] font-medium leading-6 text-brand-blue">{promotion.titulo}</h3>
                        <StateChip state={promotion.estado_aprobacion} />
                      </div>
                      <p className="mt-0.5 text-xs text-brand-blue/70">
                        {promotion.servicio_nombre ?? 'General'} · {dateFormatter.format(new Date(promotion.fecha_inicio))} – {dateFormatter.format(new Date(promotion.fecha_fin))}
                      </p>
                      {promotion.descripcion && <p className="mt-2 text-sm leading-6 text-brand-blue/75">{promotion.descripcion}</p>}
                      {promotion.estado_aprobacion === 'rechazado' && promotion.motivo_revision && (
                        <p className="mt-3 flex items-start gap-2 rounded-lg border border-clay-200 bg-clay-50 px-3.5 py-2.5 text-sm text-clay-900"><AlertIcon className="mt-0.5 size-4 shrink-0 text-clay-600" /><span><b className="font-medium">Motivo:</b> {promotion.motivo_revision}</span></p>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar la promoción "${promotion.titulo}"?`)) return;
                          try {
                            await providerApi.deletePromotion(token!, promotion.id);
                            await load();
                          } catch (requestError) {
                            setError(requestError instanceof Error ? requestError.message : 'No fue posible eliminarla.');
                          }
                        }}
                        className="btn -ml-3 mt-2 min-h-8 px-3 py-1 !text-xs text-clay-700 hover:bg-clay-50"
                      >
                        <TrashIcon className="size-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {!promociones.length && (
                <li><EmptyState icon={TagIcon} title="Todavía no has publicado promociones" text="Crea una con el formulario: el equipo la revisa y aparece en la Agenda." /></li>
              )}
            </ul>
          </div>
        </>
      )}
    </section>
  );
};

const editableFields: Array<{ key: keyof ServiceChanges; label: string; rows: number; hint?: string }> = [
  { key: 'descripcion', label: 'Descripción', rows: 4, hint: '¿Qué ofreces y qué lo hace especial?' },
  { key: 'horario', label: 'Horario', rows: 2 },
  { key: 'rango_precio', label: 'Precios', rows: 3 },
  { key: 'contacto', label: 'Contacto (teléfono / WhatsApp)', rows: 2, hint: 'El botón "Reservar" usa el primer teléfono que escribas aquí.' },
  { key: 'reservacion', label: 'Cómo reservar', rows: 3 },
];

const ServiceEditor = ({ service, token, onSaved }: { service: ProviderService; token: string; onSaved: () => Promise<void> }) => {
  const [draft, setDraft] = useState<ServiceChanges>(() => Object.fromEntries(editableFields.map(({ key }) => [key, service[key] ?? ''])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const dirty = editableFields.some(({ key }) => (draft[key] ?? '') !== (service[key] ?? ''));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await providerApi.updateService(token, service.id, draft);
      setMessage({ tone: 'ok', text: 'Cambios guardados.' });
      await onSaved();
    } catch (requestError) {
      setMessage({ tone: 'error', text: requestError instanceof Error ? requestError.message : 'No fue posible guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${panelSurface} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-sand px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-brand-teal"><StoreIcon className="size-[18px]" /></span>
          <div className="min-w-0">
            <h3 className="font-display truncate text-xl font-normal text-brand-blue">{service.nombre}</h3>
            <p className="flex flex-wrap gap-x-3 text-xs text-brand-blue/70">
              {service.municipio && <span className="inline-flex items-center gap-1"><PinIcon className="size-3.5" />{service.municipio}</span>}
              {service.updated_at && <span>Actualizado el {updatedFormatter.format(new Date(service.updated_at))}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StateChip state={service.estado_aprobacion} />
          {service.slug && service.estado_aprobacion === 'aprobado' && (
            <Link to={`/servicios/${service.slug}`} className="inline-flex items-center gap-1 text-xs text-brand-blue/70 underline-offset-2 hover:text-brand-blue hover:underline">
              Ver como turista <ExternalIcon className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-x-5 gap-y-4 px-5 py-5 sm:px-6 md:grid-cols-2">
        {editableFields.map(({ key, label, rows, hint }) => (
          <label key={key} className={key === 'descripcion' ? 'md:col-span-2' : ''}>
            <span className={labelClass}>{label}</span>
            <textarea
              rows={rows}
              value={draft[key] ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
              className="field mt-1.5 resize-y"
            />
            {hint && <span className="mt-1 block text-[11.5px] leading-4 text-brand-blue/70">{hint}</span>}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-brand-sand bg-brand-paper/60 px-5 py-3.5 sm:px-6">
        <button type="submit" disabled={!dirty || saving} className="btn btn-primary">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {dirty && !saving && !message && <span className="inline-flex items-center gap-1.5 text-xs text-brand-blue/70"><span className="size-1.5 rounded-full bg-brand-gold" aria-hidden="true" />Tienes cambios sin guardar.</span>}
        {message && <Notice tone={message.tone} className="py-2">{message.text}</Notice>}
      </div>
    </form>
  );
};

const PromotionForm = ({ services, token, onCreated }: { services: ProviderService[]; token: string; onCreated: () => Promise<void> }) => {
  const empty = (): NewPromotion => ({
    servicio_id: services[0]?.id ?? 0,
    titulo: '',
    descripcion: '',
    condiciones: '',
    fecha_inicio: today(),
    fecha_fin: '',
  });
  const [form, setForm] = useState<NewPromotion>(empty);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  if (!services.length) return null;

  const update = <K extends keyof NewPromotion>(key: K, value: NewPromotion[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      await providerApi.createPromotion(token, form);
      setForm(empty());
      setMessage({ tone: 'ok', text: '¡Listo! Tu promoción quedó en revisión.' });
      await onCreated();
    } catch (requestError) {
      setMessage({ tone: 'error', text: requestError instanceof Error ? requestError.message : 'No fue posible enviarla.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${panelSurface} h-fit lg:sticky lg:top-24`}>
      <div className="border-b border-brand-sand px-5 py-4 sm:px-6">
        <h3 className="font-display text-xl font-normal text-brand-blue">Nueva promoción</h3>
        <p className="mt-0.5 text-xs text-brand-blue/70">Se publica después de la revisión.</p>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:px-6">
        <label>
          <span className={labelClass}>Servicio</span>
          <select value={form.servicio_id} onChange={(event) => update('servicio_id', Number(event.target.value))} className="field mt-1.5">
            {services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Título</span>
          <input required minLength={3} maxLength={255} value={form.titulo} onChange={(event) => update('titulo', event.target.value)} placeholder="Ej. 2x1 en cabañas entre semana" className="field mt-1.5" />
        </label>
        <label>
          <span className={labelClass}>Descripción</span>
          <textarea rows={3} value={form.descripcion} onChange={(event) => update('descripcion', event.target.value)} className="field mt-1.5 resize-y" />
        </label>
        <label>
          <span className={labelClass}>Condiciones</span>
          <input value={form.condiciones} onChange={(event) => update('condiciones', event.target.value)} placeholder="Ej. Válido de lunes a jueves" className="field mt-1.5" />
        </label>
        <div className="grid gap-3 min-[380px]:grid-cols-2">
          <label>
            <span className={labelClass}>Desde</span>
            <input required type="date" value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} className="field mt-1.5 min-w-0" />
          </label>
          <label>
            <span className={labelClass}>Hasta</span>
            <input required type="date" min={form.fecha_inicio || today()} value={form.fecha_fin} onChange={(event) => update('fecha_fin', event.target.value)} className="field mt-1.5" />
          </label>
        </div>
      </div>
      <div className="grid gap-3 border-t border-brand-sand bg-brand-paper/60 px-5 py-4 sm:px-6">
        <button type="submit" disabled={sending} className="btn btn-primary w-full">
          {sending ? 'Enviando…' : 'Enviar a revisión'}
        </button>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </div>
    </form>
  );
};
