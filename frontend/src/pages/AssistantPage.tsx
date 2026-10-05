import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { askAssistant, type AssistantResponse } from '../services/assistantApi';

const examples = [
  '¿Qué puedo hacer en Jalpan de Serra?',
  '¿Qué servicios de hospedaje hay?',
  '¿Qué lugares están cerca?',
];

export const AssistantPage = () => {
  const [question, setQuestion] = useState(examples[0]);
  const [result, setResult] = useState<AssistantResponse['data'] | null>(null);
  const [location, setLocation] = useState<{ latitud: number; longitud: number } | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isOnline || question.trim().length < 3) return;
    setLoading(true);
    setError('');
    try {
      const response = await askAssistant(question.trim(), location);
      setResult(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible consultar el asistente.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Este dispositivo no ofrece geolocalización.');
      return;
    }
    setLocationLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitud: coords.latitude, longitud: coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setError('No fue posible obtener tu ubicación. Puedes seguir consultando sin compartirla.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Asistente XploraSG</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Pregunta con datos reales del catálogo</h1>
          <p className="mt-4 leading-7 text-stone-600">
            Las respuestas se limitan a lugares, actividades y servicios publicados por XploraSG. Si no hay información suficiente, el asistente te lo dirá claramente.
          </p>
          <div className="mt-7 space-y-2">
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setQuestion(example)} className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-bold text-stone-700 hover:border-emerald-500">
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={(event) => void submit(event)}>
            <label htmlFor="assistant-question" className="text-sm font-black">¿Qué quieres saber?</label>
            <textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} maxLength={500} className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 leading-6 outline-none focus:border-emerald-600" />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={!isOnline || loading || question.trim().length < 3} className="rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? 'Consultando…' : 'Consultar'}
              </button>
              <div className="flex flex-col gap-1 items-start">
                <button type="button" disabled={locationLoading} onClick={requestLocation} className="rounded-full border border-emerald-900/20 px-5 py-3 text-sm font-black text-emerald-950 disabled:opacity-40">
                  {locationLoading ? 'Obteniendo ubicación…' : location ? 'Ubicación agregada' : 'Usar mi ubicación'}
                </button>
                <span className="text-[10px] text-stone-500 ml-3">Compartir tu ubicación es opcional</span>
              </div>
            </div>
          </form>

          {!isOnline && <p role="status" className="mt-5 rounded-2xl bg-amber-100 p-4 text-sm font-bold text-amber-950">El asistente necesita conexión. El catálogo sincronizado sigue disponible en Explorar.</p>}
          {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}

          {result && (
            <div className="mt-7 border-t border-stone-200 pt-6">
              <div className="whitespace-pre-line leading-7 text-stone-700">{result.respuesta}</div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-stone-500">{result.aviso}</p>
              {result.referencias.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {result.referencias.map((reference) => reference.tipo === 'lugar' && reference.slug ? (
                    <Link key={`${reference.tipo}-${reference.id}`} to={`/lugares/${reference.slug}`} className="rounded-2xl bg-emerald-50 p-4 text-sm hover:bg-emerald-100">
                      <span className="font-black text-emerald-950">{reference.nombre}</span>
                      <span className="mt-1 block text-stone-600">{reference.municipio}{reference.distanciaKm === null ? '' : ` · ${reference.distanciaKm} km`}</span>
                    </Link>
                  ) : (
                    <div key={`${reference.tipo}-${reference.id}`} className="rounded-2xl bg-stone-100 p-4 text-sm">
                      <span className="font-black">{reference.nombre}</span>
                      <span className="mt-1 block text-stone-600">{reference.municipio}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
