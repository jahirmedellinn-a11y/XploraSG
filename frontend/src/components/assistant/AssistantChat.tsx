// Conversación con Chatboot. La usan la página /asistente y el botón flotante.
// Estilo libreta de campo: las respuestas van sobre papel con un filete al margen, las preguntas en crema;
// cada lugar recomendado es una tarjeta con acciones concretas (ver en mapa, guardar, contactar).
import { useEffect, useImperativeHandle, useRef, useState, type FormEvent, type Ref } from 'react';
import { Link } from 'react-router-dom';
import { askAssistant, type AssistantReference, type AssistantWeather } from '../../services/assistantApi';
import { trackEvent } from '../../services/feedbackApi';
import { useLanguage, useMessages } from '../../i18n';
import { assistantMessages } from '../../i18n/assistant';
import { ArrowRightIcon, MapIcon, MicIcon, PinIcon, SpeakerIcon, SpeakerOffIcon, WifiOffIcon } from '../brand/icons';
import { FavoriteButton } from '../FavoriteButton';
import { WhatsAppIcon } from '../WhatsAppButton';
import { buildWhatsappUrl, hasRealPhone } from '../../utils/whatsapp';
import { useVoice } from './useVoice';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  references?: AssistantReference[];
  weather?: AssistantWeather | null;
  mode?: string;
  /** Pregunta que falló: permite reintentar sin volver a escribirla. */
  retry?: string;
}

export interface AssistantChatHandle {
  ask: (question: string) => void;
}

const referenceLink = (reference: AssistantReference) => {
  if (!reference.slug) return null;
  if (reference.tipo === 'servicio') return `/servicios/${reference.slug}`;
  return `/lugares/${reference.slug}`;
};

const actionClass = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-300';

interface ReferenceCardProps {
  reference: AssistantReference;
  onNavigate?: () => void;
}

/** Tarjeta de un lugar o servicio recomendado: nombre, ubicación, resumen, dato clave y acciones. */
const ReferenceCard = ({ reference, onNavigate }: ReferenceCardProps) => {
  const m = useMessages(assistantMessages);
  const { lang } = useLanguage();
  const to = referenceLink(reference);
  const canMap = reference.tipo === 'lugar' && reference.enMapa && reference.slug;
  const canSave = reference.tipo === 'lugar';
  const canContact = reference.tipo === 'servicio' && hasRealPhone(reference.contacto);
  const meta = [reference.municipio, reference.distanciaKm !== null ? m.kmAway(reference.distanciaKm) : null].filter(Boolean).join(' · ');

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {to ? (
            <Link to={to} onClick={onNavigate} className="font-display text-[1.05rem] leading-snug text-brand-blue underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:decoration-brand-green">
              {reference.nombre}
            </Link>
          ) : (
            <p className="font-display text-[1.05rem] leading-snug text-brand-blue">{reference.nombre}</p>
          )}
          {meta && <p className="meta mt-0.5">{meta}</p>}
        </div>
        {canSave && <FavoriteButton placeId={reference.id} size="sm" />}
      </div>
      {reference.resumen && <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-brand-blue/75">{reference.resumen}</p>}
      {reference.detalle && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-brand-blue/75"><span className="font-medium text-brand-blue">{reference.tipo === 'servicio' ? m.price : m.whatToDo}:</span> {reference.detalle}</p>}
      {(canMap || canContact) && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {canMap && (
            <Link
              to={`/mapa?lugar=${encodeURIComponent(reference.slug!)}`}
              onClick={onNavigate}
              aria-label={m.mapLabel(reference.nombre)}
              className={`${actionClass} border-brand-blue/20 text-brand-blue hover:border-brand-blue`}
            >
              <MapIcon className="size-3.5" strokeWidth={1.5} />
              {m.viewOnMap}
            </Link>
          )}
          {canContact && (
            <a
              href={buildWhatsappUrl(reference.nombre, reference.contacto, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('clic_whatsapp', { referenciaId: reference.id })}
              aria-label={m.contactLabel(reference.nombre)}
              className={`${actionClass} border-brand-green/40 text-brand-green hover:border-brand-green hover:bg-brand-green hover:text-white`}
            >
              <WhatsAppIcon className="size-3.5" />
              {m.contact}
            </a>
          )}
        </div>
      )}
    </li>
  );
};

interface AssistantChatProps {
  variant?: 'page' | 'widget';
  /** Se llama al abrir un enlace del catálogo (el widget se cierra en móvil). */
  onNavigate?: () => void;
  autoFocus?: boolean;
  /** Permite que la página envíe preguntas desde sus accesos rápidos. */
  ref?: Ref<AssistantChatHandle>;
}

export const AssistantChat = ({ variant = 'page', onNavigate, autoFocus = false, ref }: AssistantChatProps) => {
  const m = useMessages(assistantMessages);
  const { lang } = useLanguage();
  const compact = variant === 'widget';
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ id: 0, role: 'assistant', text: m.welcome }]);
  const [suggestions, setSuggestions] = useState<string[]>(m.starters);
  const [question, setQuestion] = useState('');
  const [location, setLocation] = useState<{ latitud: number; longitud: number } | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);
  const inputId = compact ? 'assistant-widget-question' : 'assistant-question';
  // En la página, los accesos rápidos viven en la columna editorial: aquí sólo aparecen las sugerencias de seguimiento.
  const answered = messages.some((message) => message.role === 'user');
  const showSuggestions = compact || answered;

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Al llegar una respuesta se muestra desde su inicio (no desde el final de la lista de lugares).
  const lastAnswerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const last = messages[messages.length - 1];
    const answer = lastAnswerRef.current;
    if (!loading && last?.role === 'assistant' && last.id > 0 && answer) {
      const offset = answer.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTo({ top: Math.max(0, box.scrollTop + offset - 16), behavior: 'smooth' });
    } else {
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // Manos libres: lo dictado se escribe en el campo y, al terminar, se envía solo.
  const voice = useVoice({
    lang,
    onInterim: (text) => setQuestion(text),
    onFinal: (text) => void send(text),
  });

  const send = async (text: string) => {
    const clean = text.trim();
    if (!isOnline || loading || clean.length < 2) return;
    setMessages((current) => [...current.filter((message) => message.retry !== clean), { id: nextId.current++, role: 'user', text: clean }]);
    setQuestion('');
    setLoading(true);
    trackEvent('consulta_asistente', { termino: clean.slice(0, 120) });
    try {
      const { data } = await askAssistant(clean, location, !answered);
      setMessages((current) => [...current, {
        id: nextId.current++, role: 'assistant', text: data.texto || data.respuesta, references: data.referencias, weather: data.clima, mode: data.modo,
      }]);
      if (data.sugerencias?.length) setSuggestions(data.sugerencias);
      if (voice.speakReplies) voice.speak(data.texto || data.respuesta);
    } catch (requestError) {
      const failure = requestError instanceof Error && requestError.message ? requestError.message : m.requestFailed;
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', retry: clean, text: failure }]);
      if (voice.speakReplies) voice.speak(failure);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ ask: (text: string) => void send(text) }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(question);
  };

  const requestLocation = () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setLocationState('error');
      return;
    }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitud: coords.latitude, longitud: coords.longitude });
        setLocationState('ok');
      },
      () => setLocationState('error'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className={`flex-1 space-y-6 overflow-y-auto overscroll-contain bg-brand-paper ${compact ? 'px-5 py-5' : 'px-5 py-7 sm:px-8'}`} aria-live="polite">
        {messages.map((message, index) => (
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end">
              <p className="sr-only">{m.you}:</p>
              <p className="max-w-[85%] whitespace-pre-line rounded-lg border border-brand-sand bg-brand-light px-4 py-2.5 text-sm leading-6 text-brand-blue">{message.text}</p>
            </div>
          ) : message.retry ? (
            <div key={message.id} ref={index === messages.length - 1 ? lastAnswerRef : undefined} role="alert" className="max-w-[92%] rounded-lg border border-clay-200 bg-clay-50 px-4 py-3 text-sm leading-6 text-clay-800">
              <p>{message.text}</p>
              <button
                type="button"
                onClick={() => void send(message.retry!)}
                disabled={!isOnline || loading}
                className="mt-2 text-sm font-medium text-clay-900 underline underline-offset-4 disabled:opacity-50"
              >
                {m.retry}
              </button>
            </div>
          ) : (
            <div key={message.id} ref={index === messages.length - 1 ? lastAnswerRef : undefined} className="animate-fade-up max-w-[94%] border-l border-brand-teal/60 pl-4">
              {message.weather && (
                <p className="label-quiet mb-2">
                  {message.weather.municipio}
                  {message.weather.temperatura === null ? '' : ` · ${Math.round(message.weather.temperatura)} °C`}
                  {` · ${message.weather.condicion}`}
                </p>
              )}
              <p className="whitespace-pre-line text-[15px] leading-7 text-brand-blue">{message.text}</p>
              {message.references && message.references.length > 0 && (
                <ul className="mt-4 divide-y divide-brand-sand border-y border-brand-sand py-3.5">
                  {message.references.map((reference) => (
                    <ReferenceCard key={`${reference.tipo}-${reference.id}`} reference={reference} onNavigate={onNavigate} />
                  ))}
                </ul>
              )}
              {message.mode && message.mode !== 'local' && (
                <p className="mt-2.5 text-[11px] text-brand-blue/70">{m.aiNote(message.mode)}</p>
              )}
            </div>
          )
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 border-l border-brand-teal/60 py-2 pl-4" role="status" aria-label={m.typing}>
            {[0, 1, 2].map((dot) => <span key={dot} className="typing-dot size-1.5 rounded-full bg-brand-blue/60" style={{ animationDelay: `${dot * 160}ms` }} />)}
          </div>
        )}
      </div>

      <div className={`border-t border-brand-sand bg-brand-paper ${compact ? 'px-4 pb-4 pt-3' : 'px-5 py-4 sm:px-8'}`}>
        {!isOnline && (
          <div role="status" className="mb-3 flex gap-3 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-[13px] leading-5 text-ochre-900">
            <WifiOffIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
            <p>
              <b className="font-medium">{m.offlineTitle}.</b> {m.offlineText}{' '}
              <Link to="/favoritos" onClick={onNavigate} className="font-medium underline underline-offset-4">{m.offlineLink}</Link>
            </p>
          </div>
        )}
        {isOnline && showSuggestions && suggestions.length > 0 && (
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label={m.shortcuts}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading || !isOnline}
                onClick={() => void send(suggestion)}
                className="shrink-0 rounded-full border border-brand-blue/20 bg-brand-paper px-3.5 py-1.5 text-[13px] text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">{m.questionLabel}</label>
          <textarea
            id={inputId}
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send(question);
              }
            }}
            rows={1}
            maxLength={500}
            placeholder={isOnline ? (compact || (typeof window !== 'undefined' && window.innerWidth < 640) ? m.placeholderShort : m.placeholder) : m.placeholderOffline}
            disabled={!isOnline}
            className="field max-h-32 min-h-12 resize-none bg-white"
          />
          {voice.canDictate && (
            <button
              type="button"
              onClick={voice.listening ? voice.stopDictation : voice.startDictation}
              disabled={!isOnline || loading}
              aria-pressed={voice.listening}
              aria-label={voice.listening ? m.stopDictation : m.dictate}
              title={voice.listening ? m.stopDictation : m.dictate}
              className={`grid size-12 shrink-0 place-items-center rounded-[0.625rem] border transition-colors duration-300 disabled:opacity-35 ${
                voice.listening
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-brand-blue/20 bg-white text-brand-blue hover:border-brand-blue'
              }`}
            >
              <MicIcon className="size-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!isOnline || loading || question.trim().length < 2}
            aria-label={m.send}
            className="grid size-12 shrink-0 place-items-center rounded-[0.625rem] bg-brand-blue text-white transition-colors duration-300 hover:bg-brand-green disabled:opacity-35"
          >
            <ArrowRightIcon className="size-5" strokeWidth={1.5} />
          </button>
        </form>
        {(voice.listening || voice.dictationError) && (
          <p role="status" className={`mt-2 text-xs ${voice.dictationError ? 'text-clay-800' : 'text-brand-green'}`}>
            {voice.listening ? m.listening
              : voice.dictationError === 'denied' ? m.dictationDenied
                : voice.dictationError === 'no-speech' ? m.dictationNoSpeech
                  : voice.dictationError === 'network' ? m.dictationNetwork
                    : m.dictationOther}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={requestLocation}
            disabled={locationState === 'loading' || locationState === 'ok'}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-300 ${
              locationState === 'ok'
                ? 'bg-brand-green/10 text-brand-green'
                : 'border border-brand-blue/20 text-brand-blue hover:border-brand-green hover:text-brand-green'
            }`}
          >
            <PinIcon className="size-3.5" strokeWidth={1.5} />
            {locationState === 'loading' ? m.locating : locationState === 'ok' ? m.locationActive : m.useLocation}
          </button>
          {voice.canSpeak && (
            <button
              type="button"
              onClick={voice.toggleSpeakReplies}
              aria-pressed={voice.speakReplies}
              aria-label={m.readAloudLabel}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-300 ${
                voice.speakReplies
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'border border-brand-blue/20 text-brand-blue hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {voice.speakReplies ? <SpeakerIcon className="size-3.5" /> : <SpeakerOffIcon className="size-3.5" />}
              {m.readAloud}
            </button>
          )}
          </div>
          {!compact && <p className="text-[11px] text-brand-blue/70">{m.footer}</p>}
        </div>
        {locationState === 'error' && <p className="mt-2 text-xs text-clay-800">{m.locationError}</p>}
      </div>
    </div>
  );
};
