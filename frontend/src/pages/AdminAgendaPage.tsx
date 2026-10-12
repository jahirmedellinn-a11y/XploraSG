/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { adminInsightsApi, type AdminEvent, type EventInput } from '../services/adminPanelApi';
import { catalogApi } from '../services/catalogApi';
import type { Place } from '../types/catalog';
import { CalendarIcon, PinIcon } from '../components/brand/icons';
import { ClockIcon, EditIcon, PlusIcon, TrashIcon } from '../components/admin/AdminIcons';
import { BackLink, EmptyState, Notice, PageHeader, StatGrid, StatusPill } from '../components/admin/AdminUi';
import { fieldLabel, panelSurface, tabClass } from '../components/admin/classes';
import { statusOf } from '../components/admin/status';

const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const emptyForm = (): EventInput => ({
  nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', horario: '', contacto: '', estado_aprobacion: 'aprobado', lugar_id: null,
});

const stateLabel: Record<string, string> = { aprobado: 'Publicado', borrador: 'Borrador', en_revision: 'En revisión', rechazado: 'Rechazado', suspendido: 'Suspendido' };
const formatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'America/Mexico_City' });
const dayFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', timeZone: 'America/Mexico_City' });
const monthFormatter = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'America/Mexico_City' });

type When = 'proximos' | 'pasados' | 'todos';
const whenOptions: Array<[When, string]> = [['proximos', 'Próximos'], ['pasados', 'Pasados'], ['todos', 'Todos']];
const stateFilters: Array<[string, string]> = [['', 'Todos'], ['aprobado', 'Publicado'], ['borrador', 'Borrador'], ['suspendido', 'Suspendido']];

const labelClass = `grid gap-1.5 ${fieldLabel}`;

export const AdminAgendaPage = () => {
  usePageTitle('Administrar agenda');
  const { token } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [when, setWhen] = useState<When>('proximos');
  const [stateFilter, setStateFilter] = useState('');
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await adminInsightsApi.events(token);
      setEvents(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'No fue posible cargar los eventos.' });
    }
  }, [token]);

  useEffect(() => {
    void load();
    catalogApi.places({ limit: 100 }).then((response) => setPlaces(response.data)).catch(() => undefined);
  }, [load]);

  const update = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const startEdit = (event: AdminEvent) => {
    setEditingId(event.id);
    setForm({
      nombre: event.nombre, descripcion: event.descripcion ?? '', horario: event.horario ?? '', contacto: event.contacto ?? '',
      estado_aprobacion: event.estado_aprobacion, lugar_id: event.lugar_id,
      fecha_inicio: toLocalInput(event.fecha_inicio), fecha_fin: toLocalInput(event.fecha_fin),
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    const payload: EventInput = {
      ...form,
      fecha_inicio: new Date(form.fecha_inicio).toISOString(),
      fecha_fin: new Date(form.fecha_fin).toISOString(),
    };
    try {
      if (editingId) await adminInsightsApi.updateEvent(token, editingId, payload);
      else await adminInsightsApi.createEvent(token, payload);
      setMessage({ tone: 'ok', text: editingId ? 'Evento actualizado.' : 'Evento creado. Ya aparece en la Agenda si está publicado.' });
      setForm(emptyForm());
      setEditingId(null);
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'No fue posible guardar el evento.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (event: AdminEvent) => {
    if (!token || !window.confirm(`¿Eliminar "${event.nombre}" de la agenda?`)) return;
    try {
      await adminInsightsApi.deleteEvent(token, event.id);
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'No fue posible eliminarlo.' });
    }
  };

  const visible = events
    .filter((event) => {
      const end = new Date(event.fecha_fin).getTime();
      if (when === 'proximos' && end < now) return false;
      if (when === 'pasados' && end >= now) return false;
      return !stateFilter || event.estado_aprobacion === stateFilter;
    })
    .sort((a, b) => (when === 'pasados' ? -1 : 1) * (new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()));
  const published = events.filter((event) => event.estado_aprobacion === 'aprobado').length;
  const upcoming = events.filter((event) => new Date(event.fecha_fin).getTime() >= now).length;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        before={<BackLink to="/admin">Panel de administración</BackLink>}
        eyebrow="Agenda cultural"
        title="Administrar eventos"
        meta="Fiestas, ferias y actividades que aparecen en la Agenda pública."
        actions={
          <StatGrid className="w-full grid-cols-3 sm:w-auto">
            {([['Total', events.length], ['Próximos', upcoming], ['Publicados', published]] as const).map(([label, value]) => (
              <div key={label} className="bg-white px-4 py-3 sm:min-w-28 sm:px-5">
                <dt className="text-[12px] text-brand-blue/70">{label}</dt>
                <dd className="font-display mt-1 text-[1.75rem] leading-none text-brand-blue">{value}</dd>
              </div>
            ))}
          </StatGrid>
        }
      />

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-8">
        <form onSubmit={(event) => void submit(event)} className={`${panelSurface} h-fit lg:sticky lg:top-24`}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-sand px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-xl font-normal text-brand-blue">{editingId ? 'Editar evento' : 'Nuevo evento'}</h2>
              <p className="mt-0.5 text-xs text-brand-blue/70">Los campos con * son obligatorios.</p>
            </div>
            {editingId ? <EditIcon className="mt-1 size-[18px] text-brand-teal" /> : <PlusIcon className="mt-1 size-[18px] text-brand-teal" />}
          </div>
          <div className="grid gap-4 px-5 py-5 sm:px-6">
            <label className={labelClass}>
              Nombre *
              <input required minLength={3} maxLength={255} value={form.nombre} onChange={(event) => update('nombre', event.target.value)} className="field font-normal" placeholder="Ej. Fiesta de Santiago Apóstol" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Inicio *
                <input required type="datetime-local" value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} className="field min-w-0 font-normal" />
              </label>
              <label className={labelClass}>
                Fin *
                <input required type="datetime-local" min={form.fecha_inicio} value={form.fecha_fin} onChange={(event) => update('fecha_fin', event.target.value)} className="field min-w-0 font-normal" />
              </label>
            </div>
            <label className={labelClass}>
              Lugar relacionado
              <select value={form.lugar_id ?? ''} onChange={(event) => update('lugar_id', event.target.value ? Number(event.target.value) : null)} className="field font-normal">
                <option value="">Sin lugar específico</option>
                {places.map((place) => <option key={place.id} value={place.id}>{place.nombre} · {place.municipio}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Descripción
              <textarea rows={4} maxLength={3000} value={form.descripcion ?? ''} onChange={(event) => update('descripcion', event.target.value)} className="field resize-y font-normal" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Horario
                <input maxLength={500} value={form.horario ?? ''} onChange={(event) => update('horario', event.target.value)} className="field font-normal" placeholder="Ej. Día principal: 25 de julio" />
              </label>
              <label className={labelClass}>
                Contacto
                <input maxLength={500} value={form.contacto ?? ''} onChange={(event) => update('contacto', event.target.value)} className="field font-normal" placeholder="Turismo municipal" />
              </label>
            </div>
            <label className={labelClass}>
              Estado
              <select value={form.estado_aprobacion} onChange={(event) => update('estado_aprobacion', event.target.value)} className="field font-normal">
                <option value="aprobado">Publicado</option>
                <option value="borrador">Borrador (no visible)</option>
                <option value="suspendido">Suspendido (no visible)</option>
              </select>
            </label>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-brand-sand bg-brand-paper/60 px-5 py-4 sm:px-6">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear evento'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="btn btn-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="min-w-0">
          {/* Barra de herramientas: periodo como pestañas subrayadas + filtro de estado */}
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-brand-sand">
            <div className="flex gap-6" role="group" aria-label="Periodo">
              {whenOptions.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={when === value} onClick={() => setWhen(value)} className={tabClass(when === value)}>
                  {label}
                </button>
              ))}
            </div>
            <label className="mb-2 flex w-full items-center gap-2 text-xs text-brand-blue/70 sm:w-auto">
              <span className="sr-only sm:not-sr-only">Estado</span>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="field min-h-9 w-full py-1.5 text-[13px] sm:w-auto">
                {stateFilters.map(([value, label]) => <option key={value || 'todos'} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          {visible.length > 0 && (
            <ul className={`${panelSurface} mt-5 divide-y divide-brand-sand overflow-hidden`}>
              {visible.map((event) => {
                const start = new Date(event.fecha_inicio);
                const past = new Date(event.fecha_fin).getTime() < now;
                const editing = editingId === event.id;
                return (
                  <li key={event.id} className={`relative flex gap-4 p-4 transition-colors duration-300 sm:gap-5 sm:p-5 ${editing ? 'bg-brand-light/50' : 'hover:bg-brand-paper'}`}>
                    {editing && <span className="absolute inset-y-0 left-0 w-[2px] bg-brand-green" aria-hidden="true" />}
                    <div className={`flex w-12 shrink-0 flex-col items-center self-start border-r border-brand-sand pr-4 sm:w-14 ${past ? 'text-brand-blue/70' : 'text-brand-blue'}`} aria-hidden="true">
                      <span className={`text-[10.5px] font-medium uppercase tracking-[0.12em] ${past ? '' : 'text-brand-gold'}`}>{monthFormatter.format(start).replace('.', '')}</span>
                      <span className="font-display text-[1.75rem] leading-8">{dayFormatter.format(start)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                        <h3 className="min-w-0 text-[15px] font-medium leading-6 text-brand-blue">{event.nombre}</h3>
                        <StatusPill {...statusOf(event.estado_aprobacion, stateLabel)} />
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-brand-blue/70">
                        <span className="inline-flex items-center gap-1"><CalendarIcon className="size-3.5" />{formatter.format(start)} – {formatter.format(new Date(event.fecha_fin))}</span>
                        {event.lugar_nombre && <span className="inline-flex min-w-0 items-center gap-1"><PinIcon className="size-3.5 shrink-0" /><span className="truncate">{event.lugar_nombre}</span></span>}
                        {event.horario && <span className="inline-flex min-w-0 items-center gap-1"><ClockIcon className="size-3.5 shrink-0" /><span className="min-w-0">{event.horario}</span></span>}
                      </p>
                      <div className="-ml-3 mt-2 flex gap-1">
                        <button type="button" onClick={() => startEdit(event)} className="btn btn-ghost min-h-8 px-3 py-1 !text-xs">
                          <EditIcon className="size-3.5" /> Editar
                        </button>
                        <button type="button" onClick={() => void remove(event)} className="btn min-h-8 px-3 py-1 !text-xs text-clay-700 hover:bg-clay-50">
                          <TrashIcon className="size-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!visible.length && (
            <div className="mt-5">
              <EmptyState
                icon={CalendarIcon}
                title={events.length ? 'No hay eventos con estos filtros' : 'Aún no hay eventos registrados'}
                text={events.length ? 'Cambia el periodo o el estado para ver más eventos.' : 'Crea el primero con el formulario.'}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
