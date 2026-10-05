import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  adminReviewApi,
  type ReviewItem,
  type ReviewKind,
  type ReviewState,
} from '../services/adminReviewApi';

const stateLabels: Record<ReviewState, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

const stateTone: Record<ReviewState, string> = {
  borrador: 'bg-stone-200 text-stone-800',
  en_revision: 'bg-sky-100 text-sky-900',
  aprobado: 'bg-emerald-100 text-emerald-900',
  rechazado: 'bg-red-100 text-red-900',
  suspendido: 'bg-amber-100 text-amber-950',
};

export const AdminContentPage = () => {
  const { token } = useAuth();
  const [kind, setKind] = useState<ReviewKind>('lugar');
  const [state, setState] = useState<ReviewState | ''>('');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await adminReviewApi.list(token, kind, state);
      setItems(response.data);
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

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Administración editorial</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Revisión de contenido</h1>
      <p className="mt-3 max-w-3xl leading-7 text-stone-600">
        Revisa borradores y controla su publicación. El sistema bloquea la aprobación cuando faltan coordenadas, fuente o multimedia pública autorizada.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex rounded-2xl bg-stone-100 p-1">
          {(['lugar', 'servicio'] as ReviewKind[]).map((value) => (
            <button key={value} type="button" onClick={() => setKind(value)} className={`rounded-xl px-4 py-2 text-sm font-black ${kind === value ? 'bg-emerald-950 text-white' : 'text-stone-600'}`}>
              {value === 'lugar' ? 'Lugares' : 'Servicios'}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="review-state">Estado</label>
        <select id="review-state" value={state} onChange={(event) => setState(event.target.value as ReviewState | '')} className="min-h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold">
          <option value="">Todos los estados</option>
          {Object.entries(stateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

      {loading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-stone-200" />)}</div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={`${item.tipo}-${item.id}`} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{item.municipio || 'Sin municipio'} · {item.categoria || 'Sin categoría'}</p>
                  <h2 className="mt-2 text-xl font-black">{item.nombre}</h2>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${stateTone[item.estado]}`}>{stateLabels[item.estado]}</span>
              </div>

              {item.faltantes.length ? (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-black">No puede publicarse todavía</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{item.faltantes.map((missing) => <li key={missing}>{missing}</li>)}</ul>
                </div>
              ) : <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Cumple los requisitos automáticos de publicación.</p>}

              {item.motivoRevision && <p className="mt-4 text-sm text-stone-600"><strong>Último motivo:</strong> {item.motivoRevision}</p>}

              <label className="mt-5 block text-xs font-bold text-stone-600" htmlFor={`reason-${item.id}`}>Motivo o nota editorial</label>
              <textarea id={`reason-${item.id}`} value={reasons[item.id] || ''} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} rows={2} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm" placeholder="Obligatorio para rechazar o suspender" />

              <div className="mt-4 flex flex-wrap gap-2">
                {item.estado !== 'en_revision' && <button type="button" disabled={savingId === item.id} onClick={() => void updateState(item, 'en_revision')} className="rounded-full bg-sky-100 px-4 py-2 text-xs font-black text-sky-900 disabled:opacity-50">Enviar a revisión</button>}
                <button type="button" disabled={savingId === item.id || item.faltantes.length > 0} onClick={() => void updateState(item, 'aprobado')} className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35">Aprobar</button>
                <button type="button" disabled={savingId === item.id || !(reasons[item.id] || '').trim()} onClick={() => void updateState(item, 'rechazado')} className="rounded-full border border-red-200 px-4 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-35">Rechazar</button>
              </div>
            </article>
          ))}
          {!items.length && <p className="col-span-full rounded-3xl border border-dashed border-stone-300 p-12 text-center text-stone-600">No hay contenido con estos filtros.</p>}
        </div>
      )}
    </section>
  );
};

