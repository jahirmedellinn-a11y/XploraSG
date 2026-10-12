import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { submitSurvey } from '../services/feedbackApi';
import { defineMessages, useMessages } from '../i18n';
import {
  ArrowRightIcon, CommunityIcon, CompassIcon, HeartIcon, LodgingIcon, ShieldIcon, SparkleIcon,
} from '../components/brand/icons';
import { ItalicTail } from '../components/home/HomeUi';

// Los valores (turista, mapa, satisfaccion…) se guardan tal cual y se agregan en el panel admin:
// sólo se traducen las etiquetas visibles.
const PROFILES = ['turista', 'prestador', 'estudiante', 'docente', 'otro'] as const;
const MODULES = ['explorar', 'mapa', 'rutas', 'asistente', 'agenda', 'servicios', 'favoritos'] as const;
const QUESTIONS = ['satisfaccion', 'facilidad', 'utilidad'] as const;

const surveyMessages = defineMessages({
  pageTitle: 'Encuesta de satisfacción',
  pageDescription: 'Ayúdanos a mejorar XploraSG respondiendo una encuesta de 2 minutos.',
  profiles: { turista: 'Turista', prestador: 'Prestador de servicios', estudiante: 'Estudiante', docente: 'Docente', otro: 'Otro' } as Record<(typeof PROFILES)[number], string>,
  modules: {
    explorar: 'Explorar lugares', mapa: 'Mapa y GPS', rutas: 'Rutas', asistente: 'Chatboot', agenda: 'Agenda', servicios: 'Servicios y reservas', favoritos: 'Favoritos',
  } as Record<(typeof MODULES)[number], string>,
  questions: {
    satisfaccion: '¿Qué tan satisfecho(a) estás con XploraSG?',
    facilidad: '¿Qué tan fácil fue encontrar lo que buscabas?',
    utilidad: '¿Qué tan útil te parece para planear tu visita a la Sierra Gorda?',
  } as Record<(typeof QUESTIONS)[number], string>,
  scale: '1 = nada · 5 = mucho',
  incomplete: 'Responde las tres calificaciones y si recomendarías XploraSG.',
  sendFailed: 'No fue posible enviar la encuesta.',
  thanksTitle: '¡Gracias por tu tiempo!',
  thanksMessage: 'Tus respuestas nos ayudan a validar y mejorar XploraSG para los turistas y las comunidades de la Sierra Gorda.',
  keepExploring: 'Seguir explorando',
  eyebrow: 'Validación del prototipo',
  title: '¿Cómo fue tu experiencia?',
  intro: 'Encuesta anónima de 2 minutos. Es parte de la evaluación del proyecto Nuevos Talentos Científicos y Tecnológicos 2026.',
  alreadyAnswered: 'Ya respondiste desde este dispositivo. Puedes enviar otra respuesta solo si eres otra persona.',
  profileLegend: 'Perfil',
  profileQuestion: '¿Cómo participas?',
  recommendLegend: 'Recomendación',
  recommendQuestion: '¿Recomendarías XploraSG a otras personas?',
  yes: 'Sí',
  no: 'No',
  timeLegend: 'Tiempo de búsqueda',
  timeTitle: 'Tiempo para planear una visita',
  timeHint: 'Aproximado, en minutos, para encontrar un lugar, su información y cómo llegar.',
  timeOther: 'Con otros medios (Google, redes, preguntar)',
  timeXplora: 'Con XploraSG',
  example: (n: number) => `Ej. ${n}`,
  commentsLegend: 'Comentarios',
  favoriteQuestion: '¿Qué te gustó más?',
  selectOptional: 'Selecciona (opcional)',
  commentsLabel: 'Comentarios o sugerencias (opcional)',
  commentsPlaceholder: '¿Qué mejorarías?',
  sending: 'Enviando…',
  submit: 'Enviar respuestas',
  privacyBefore: 'No pedimos nombre ni correo. Consulta el ',
  privacyLink: 'Aviso de privacidad',
  privacyAfter: '.',
  progress: (done: number, total: number) => `${done} de ${total} respuestas obligatorias`,
  progressDone: 'Listo para enviar',
  ratingsLegend: 'Calificaciones',
  ratingsTitle: 'Califica tu experiencia',
  scaleLow: 'Nada',
  scaleHigh: 'Mucho',
  required: 'Obligatoria',
  optional: 'Opcional',
  minutes: 'min',
  anonymous: 'Anónima',
  duration: '2 minutos',
}, {
  pageTitle: 'Satisfaction survey',
  pageDescription: 'Help us improve XploraSG by answering a 2-minute survey.',
  profiles: { turista: 'Tourist', prestador: 'Local business / service provider', estudiante: 'Student', docente: 'Teacher', otro: 'Other' },
  modules: {
    explorar: 'Exploring places', mapa: 'Map & GPS', rutas: 'Routes', asistente: 'Chatboot', agenda: 'Events', servicios: 'Services & bookings', favoritos: 'Favorites',
  },
  questions: {
    satisfaccion: 'How satisfied are you with XploraSG?',
    facilidad: 'How easy was it to find what you were looking for?',
    utilidad: 'How useful is it for planning your visit to the Sierra Gorda?',
  },
  scale: '1 = not at all · 5 = very much',
  incomplete: 'Please answer all three ratings and whether you would recommend XploraSG.',
  sendFailed: 'We couldn’t send the survey.',
  thanksTitle: 'Thanks for your time!',
  thanksMessage: 'Your answers help us validate and improve XploraSG for visitors and the communities of the Sierra Gorda.',
  keepExploring: 'Keep exploring',
  eyebrow: 'Prototype validation',
  title: 'How was your experience?',
  intro: 'Anonymous 2-minute survey. It is part of the evaluation of the Nuevos Talentos Científicos y Tecnológicos 2026 project.',
  alreadyAnswered: 'You already answered from this device. Only send another response if you are a different person.',
  profileLegend: 'Profile',
  profileQuestion: 'How are you taking part?',
  recommendLegend: 'Recommendation',
  recommendQuestion: 'Would you recommend XploraSG to others?',
  yes: 'Yes',
  no: 'No',
  timeLegend: 'Search time',
  timeTitle: 'Time to plan a visit',
  timeHint: 'Approximate minutes to find a place, its information and how to get there.',
  timeOther: 'With other means (Google, social media, asking around)',
  timeXplora: 'With XploraSG',
  example: (n: number) => `e.g. ${n}`,
  commentsLegend: 'Comments',
  favoriteQuestion: 'What did you like most?',
  selectOptional: 'Select (optional)',
  commentsLabel: 'Comments or suggestions (optional)',
  commentsPlaceholder: 'What would you improve?',
  sending: 'Sending…',
  submit: 'Send answers',
  privacyBefore: 'We don’t ask for your name or email. See our ',
  privacyLink: 'Privacy notice',
  privacyAfter: '.',
  progress: (done: number, total: number) => `${done} of ${total} required answers`,
  progressDone: 'Ready to send',
  ratingsLegend: 'Ratings',
  ratingsTitle: 'Rate your experience',
  scaleLow: 'Not at all',
  scaleHigh: 'Very much',
  required: 'Required',
  optional: 'Optional',
  minutes: 'min',
  anonymous: 'Anonymous',
  duration: '2 minutes',
});
const DONE_KEY = 'xplora:encuestaRespondida';

type IconType = typeof CompassIcon;
const PROFILE_ICONS: Record<(typeof PROFILES)[number], IconType> = {
  turista: CompassIcon, prestador: LodgingIcon, estudiante: SparkleIcon, docente: CommunityIcon, otro: HeartIcon,
};

const CheckIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
);
const CrossIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
);

/** Encabezado de cada paso: número en serif, título y si es obligatorio. */
const StepHeader = ({ step, title, required, done }: { step: number; title: string; required?: boolean; done?: boolean }) => {
  const m = useMessages(surveyMessages);
  return (
    <div className="flex items-baseline gap-4 sm:gap-6">
      <span className={`font-display w-10 shrink-0 text-[1.75rem] italic leading-none tabular-nums transition-colors duration-300 sm:w-12 sm:text-[2rem] ${done ? 'text-brand-green' : 'text-brand-gold'}`} aria-hidden="true">
        {String(step).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[1.375rem] leading-snug text-brand-blue sm:text-2xl">{title}</h2>
        <p className="mt-1.5 flex items-center gap-2 label-quiet">
          {required ? m.required : m.optional}
          {done && <CheckIcon className="size-3.5 text-brand-green" />}
        </p>
      </div>
    </div>
  );
};

// Contenido de cada paso alineado con el título (deja libre la columna del número).
const stepBody = 'sm:pl-[4.5rem]';

const tileClass = (active: boolean) =>
  `rounded-lg border transition-colors duration-300 ${
    active ? 'border-brand-blue bg-brand-light text-brand-blue' : 'border-brand-blue/15 bg-white text-brand-blue/80 hover:border-brand-blue/40 hover:text-brand-blue'
  }`;

const Rating = ({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) => {
  const m = useMessages(surveyMessages);
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="mt-4 grid grid-cols-5 gap-2 sm:max-w-sm">
        {[1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`font-display grid h-12 place-items-center rounded-lg border text-lg transition-colors duration-300 ${
              value === option
                ? 'border-brand-blue bg-brand-blue text-white'
                : value > option
                  ? 'border-brand-blue/20 bg-brand-light text-brand-blue'
                  : 'border-brand-blue/15 bg-white text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-brand-blue/70 sm:max-w-sm" aria-hidden="true">
        <span>{m.scaleLow}</span>
        <span>{m.scaleHigh}</span>
      </div>
    </div>
  );
};

/** Línea de progreso fina. */
const Progress = ({ done, total, complete, className = '' }: { done: number; total: number; complete: boolean; className?: string }) => {
  const m = useMessages(surveyMessages);
  const percent = Math.round((done / total) * 100);
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-brand-blue/75">{complete ? m.progressDone : m.progress(done, total)}</span>
        <span className="tabular-nums text-brand-green">{percent}%</span>
      </div>
      <div className="mt-2.5 h-px bg-brand-sand" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={m.progress(done, total)}>
        <div className="-mt-px h-[3px] bg-brand-green transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export const SurveyPage = () => {
  const m = useMessages(surveyMessages);
  usePageTitle(m.pageTitle, m.pageDescription);
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<string>('turista');
  const [scores, setScores] = useState({ satisfaccion: 0, facilidad: 0, utilidad: 0 });
  const [recomendaria, setRecomendaria] = useState<boolean | null>(null);
  const [minutesOther, setMinutesOther] = useState('');
  const [minutesXplora, setMinutesXplora] = useState('');
  const [modulo, setModulo] = useState('');
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const alreadyAnswered = (() => { try { return Boolean(localStorage.getItem(DONE_KEY)); } catch { return false; } })();

  const complete = scores.satisfaccion && scores.facilidad && scores.utilidad && recomendaria !== null;
  const requiredDone = QUESTIONS.filter((key) => scores[key] > 0).length + (recomendaria !== null ? 1 : 0);
  const requiredTotal = QUESTIONS.length + 1;
  const ratingsDone = QUESTIONS.every((key) => scores[key] > 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!complete) {
      setError(m.incomplete);
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitSurvey({
        perfil,
        ...scores,
        recomendaria: recomendaria!,
        minutos_otros_medios: minutesOther === '' ? null : Number(minutesOther),
        minutos_xplorasg: minutesXplora === '' ? null : Number(minutesXplora),
        modulo_favorito: modulo || null,
        comentario: comentario.trim(),
      }, token);
      try { localStorage.setItem(DONE_KEY, new Date().toISOString()); } catch { /* sin almacenamiento */ }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : m.sendFailed);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="animate-fade-up mx-auto max-w-xl border-t border-brand-sand pt-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-brand-green/35 text-brand-green" aria-hidden="true"><CheckIcon className="size-6" /></span>
          <h1 className="mt-7 text-[2.25rem] leading-[1.08] text-brand-blue sm:text-5xl">{m.thanksTitle}</h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-brand-blue/75">{m.thanksMessage}</p>
          <Link to="/" className="btn btn-accent mt-9 min-h-12 px-7">{m.keepExploring}<ArrowRightIcon className="size-4" /></Link>
        </div>
      </section>
    );
  }

  const step = 'border-t border-brand-sand py-9 sm:py-11';
  const fieldLabel = 'text-sm text-brand-blue/75';

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        {/* Introducción */}
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:h-fit">
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] text-brand-blue sm:text-5xl"><ItalicTail text={m.title} words={1} /></h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-brand-blue/75">{m.intro}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-blue/70">
            <span className="inline-flex items-center gap-1.5"><ShieldIcon className="size-3.5 text-brand-green" />{m.anonymous}</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-brand-gold" aria-hidden="true" />{m.duration}</span>
          </p>
          {alreadyAnswered && (
            <p role="status" className="mt-6 max-w-md border-l-2 border-brand-teal bg-brand-light px-4 py-3 text-sm leading-6 text-brand-blue">
              {m.alreadyAnswered}
            </p>
          )}
          <Progress done={requiredDone} total={requiredTotal} complete={Boolean(complete)} className="mt-10 hidden max-w-sm lg:block" />
        </div>

        <div className="lg:col-span-8 lg:pl-8">
          {/* Progreso fijo en móvil */}
          <div className="sticky top-[72px] z-20 -mx-5 border-b border-brand-sand bg-brand-paper px-5 py-3 lg:hidden">
            <Progress done={requiredDone} total={requiredTotal} complete={Boolean(complete)} />
          </div>

          <form onSubmit={(event) => void submit(event)} className="border-b border-brand-sand">
            <fieldset className={step}>
              <legend className="sr-only">{m.profileLegend}</legend>
              <StepHeader step={1} title={m.profileQuestion} done />
              <div className={`mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 ${stepBody}`}>
                {PROFILES.map((value) => {
                  const Icon = PROFILE_ICONS[value];
                  const active = perfil === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPerfil(value)}
                      className={`flex min-h-14 items-center gap-3 px-3.5 py-3 text-left text-sm ${tileClass(active)}`}
                    >
                      <Icon className={`size-[18px] shrink-0 ${active ? 'text-brand-green' : 'text-brand-teal'}`} />
                      <span className="leading-tight">{m.profiles[value]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className={step}>
              <StepHeader step={2} title={m.ratingsTitle} required done={ratingsDone} />
              <div className={`mt-4 ${stepBody}`}>
                {QUESTIONS.map((key) => {
                  const label = m.questions[key];
                  return (
                    <fieldset key={key} className="border-t border-brand-sand py-6 first:border-t-0 first:pt-2 last:pb-0">
                      <legend className="sr-only">{label}</legend>
                      <p className="text-[15px] leading-6 text-brand-blue">{label} <span className="text-brand-gold" aria-hidden="true">*</span></p>
                      <Rating label={label} value={scores[key]} onChange={(value) => setScores((current) => ({ ...current, [key]: value }))} />
                    </fieldset>
                  );
                })}
              </div>
            </div>

            <fieldset className={step}>
              <legend className="sr-only">{m.recommendLegend}</legend>
              <StepHeader step={3} title={m.recommendQuestion} required done={recomendaria !== null} />
              <div className={`mt-6 grid grid-cols-2 gap-2 sm:max-w-[calc(24rem+4.5rem)] ${stepBody}`}>
                {([[true, m.yes], [false, m.no]] as const).map(([value, label]) => {
                  const active = recomendaria === value;
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRecomendaria(value)}
                      className={`flex min-h-12 items-center justify-center gap-2 px-6 text-[15px] ${tileClass(active)}`}
                    >
                      {value ? <CheckIcon className={`size-4 ${active ? 'text-brand-green' : ''}`} /> : <CrossIcon className="size-4" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className={step}>
              <legend className="sr-only">{m.timeLegend}</legend>
              <StepHeader step={4} title={m.timeTitle} done={minutesOther !== '' && minutesXplora !== ''} />
              <div className={stepBody}>
                <p className="mt-4 max-w-xl text-sm leading-6 text-brand-blue/70">{m.timeHint}</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="grid content-start gap-2">
                    <label htmlFor="survey-min-other" className={fieldLabel}>{m.timeOther}</label>
                    <div className="relative mt-auto">
                      <input id="survey-min-other" type="number" min={0} max={600} inputMode="numeric" value={minutesOther} onChange={(event) => setMinutesOther(event.target.value)} className="field pr-14" placeholder={m.example(30)} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-blue/70" aria-hidden="true">{m.minutes}</span>
                    </div>
                  </div>
                  <div className="grid content-start gap-2">
                    <label htmlFor="survey-min-xplora" className={fieldLabel}>{m.timeXplora}</label>
                    <div className="relative mt-auto">
                      <input id="survey-min-xplora" type="number" min={0} max={600} inputMode="numeric" value={minutesXplora} onChange={(event) => setMinutesXplora(event.target.value)} className="field pr-14" placeholder={m.example(10)} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-blue/70" aria-hidden="true">{m.minutes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className={step}>
              <legend className="sr-only">{m.commentsLegend}</legend>
              <StepHeader step={5} title={m.commentsLegend} done={Boolean(modulo || comentario.trim())} />
              <div className={`grid gap-5 ${stepBody}`}>
                <label className={`mt-6 grid gap-2 ${fieldLabel}`}>
                  {m.favoriteQuestion}
                  <span className="relative">
                    <select value={modulo} onChange={(event) => setModulo(event.target.value)} className="field cursor-pointer appearance-none pr-10">
                      <option value="">{m.selectOptional}</option>
                      {MODULES.map((value) => <option key={value} value={value}>{m.modules[value]}</option>)}
                    </select>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
                  </span>
                </label>
                <label className={`grid gap-2 ${fieldLabel}`}>
                  {m.commentsLabel}
                  <textarea rows={4} maxLength={1000} value={comentario} onChange={(event) => setComentario(event.target.value)} className="field resize-y leading-6" placeholder={m.commentsPlaceholder} />
                </label>
              </div>
            </fieldset>

            <div className={`border-t border-brand-sand py-9 sm:py-11 ${stepBody}`}>
              {error && <p role="alert" className="mb-5 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-medium text-clay-800">{error}</p>}
              <button type="submit" disabled={sending} className="btn btn-accent min-h-13 w-full px-8 sm:w-auto">
                {sending ? m.sending : m.submit}
                {!sending && <ArrowRightIcon className="size-4" />}
              </button>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-brand-blue/70">
                <ShieldIcon className="mt-0.5 size-4 shrink-0 text-brand-green" />
                <span>{m.privacyBefore}<Link to="/privacidad" className="text-brand-green underline decoration-brand-green/30 underline-offset-4">{m.privacyLink}</Link>{m.privacyAfter}</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
