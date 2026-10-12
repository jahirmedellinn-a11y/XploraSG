import { CONTACT_EMAIL as OFFICIAL_CONTACT_EMAIL } from '../config/contact';
import { useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { legalMessages } from '../i18n/legal';
import { CalendarIcon } from '../components/brand/icons';

// IMPORTANTE: plantilla redactada para el prototipo académico. Debe revisarla el asesor o el área
// jurídica de la institución antes de publicar. Sustituye los datos entre corchetes.
// Correo para derechos ARCO: variable de entorno o, si no existe, el correo oficial del proyecto.
const CONTACT_EMAIL_ENV = (import.meta.env.VITE_CONTACTO_PRIVACIDAD as string | undefined) || OFFICIAL_CONTACT_EMAIL;

const tocMessages = defineMessages({
  onThisPage: 'En esta página',
}, {
  onThisPage: 'On this page',
});

type TocItem = { id: string; label: string };

const LegalLayout = ({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) => {
  const m = useMessages(legalMessages);
  const t = useMessages(tocMessages);
  const [toc, setToc] = useState<TocItem[]>([]);

  // Índice generado a partir de los subtítulos del documento (se asignan anclas estables).
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const items = Array.from(node.querySelectorAll('h2')).map((heading, index) => {
      const id = `seccion-${index + 1}`;
      heading.id = id;
      return { id, label: heading.textContent?.replace(/^\d+\.\s*/, '') ?? '' };
    });
    setToc(items);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 text-[2.5rem] leading-[1.05] text-brand-blue sm:text-5xl lg:text-[3.5rem]">{title}</h1>
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-brand-blue/70">
          <CalendarIcon className="size-4 text-brand-teal" />
          {m.lastUpdated}
        </p>
        {m.discrepancyNote && (
          <p className="mt-6 max-w-2xl border-l-2 border-brand-gold bg-brand-light px-4 py-3 text-sm leading-6 text-brand-blue/75">{m.discrepancyNote}</p>
        )}
      </header>

      <div className="mt-12 grid gap-10 border-t border-brand-sand pt-10 lg:mt-14 lg:grid-cols-12 lg:gap-8 lg:pt-14">
        {toc.length > 0 && (
          <nav aria-label={t.onThisPage} className="lg:sticky lg:top-28 lg:col-span-3 lg:h-fit">
            <p className="label-quiet">{t.onThisPage}</p>
            <ol className="mt-4 border-b border-brand-sand">
              {toc.map(({ id, label }, index) => (
                <li key={id} className="border-t border-brand-sand">
                  <a href={`#${id}`} className="group flex items-baseline gap-3 py-2.5 text-[13px] leading-5 text-brand-blue/70 transition-colors duration-300 hover:text-brand-green">
                    <span className="w-5 shrink-0 text-[11px] tabular-nums text-brand-gold">{String(index + 1).padStart(2, '0')}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div
          ref={contentRef}
          className="grid max-w-[68ch] gap-5 text-[15px] leading-8 text-brand-blue/75 sm:text-base lg:col-span-8 lg:col-start-5 [&_a]:decoration-brand-green/30 [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:scroll-mt-28 [&_h2]:border-t [&_h2]:border-brand-sand [&_h2]:pt-8 [&_h2]:text-[1.6rem] [&_h2]:leading-tight [&_h2]:text-brand-blue [&_li]:relative [&_li]:pl-6 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.95em] [&_li]:before:h-px [&_li]:before:w-3 [&_li]:before:bg-brand-gold [&_strong]:font-medium [&_strong]:text-brand-blue [&_ul]:grid [&_ul]:gap-3"
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export const PrivacyPage = () => {
  const m = useMessages(legalMessages);
  const { lang } = useLanguage();
  usePageTitle(m.privacyTitle);
  const CONTACT_EMAIL = CONTACT_EMAIL_ENV || m.contactPlaceholder;
  return (
    <LegalLayout eyebrow={m.privacyEyebrow} title={m.privacyTitle}>
      {lang === 'en' ? <PrivacyEn contactEmail={CONTACT_EMAIL} /> : <PrivacyEs contactEmail={CONTACT_EMAIL} />}
    </LegalLayout>
  );
};

const PrivacyEs = ({ contactEmail: CONTACT_EMAIL }: { contactEmail: string }) => (
    <>
      <p>
        El equipo del proyecto <strong>XploraSG – Plataforma de Turismo Inteligente para la Sierra Gorda</strong>, desarrollado en la Unidad
        Académica Jalpan dentro del programa Nuevos Talentos Científicos y Tecnológicos 2026, es responsable del tratamiento de los datos personales
        que proporciones, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares vigente en México.
      </p>
      <h2>¿Qué datos recabamos?</h2>
      <ul>
        <li><strong>Cuenta (opcional):</strong> nombre y correo electrónico. La contraseña la gestiona Supabase Auth y se guarda cifrada (hash bcrypt); el equipo nunca la conoce.</li>
        <li><strong>Favoritos:</strong> los lugares que guardas, vinculados a tu cuenta o sólo en tu dispositivo si no inicias sesión.</li>
        <li><strong>Ubicación (opcional):</strong> sólo cuando pulsas “Usar mi ubicación”. Se usa en el momento para mostrar lugares cercanos, rutas o el clima, y <strong>no se almacena</strong>.</li>
        <li><strong>Encuesta de satisfacción:</strong> respuestas anónimas; no pedimos nombre ni correo.</li>
        <li><strong>Estadísticas de uso:</strong> registros anónimos (por ejemplo, “se vio un lugar” o “se buscó ‘cascadas’”), sin IP ni identificadores personales.</li>
        <li><strong>Prestadores de servicios:</strong> datos comerciales públicos del negocio (nombre, contacto, horarios, precios) que el prestador decide publicar.</li>
      </ul>
      <h2>¿Para qué los usamos?</h2>
      <ul>
        <li>Crear tu cuenta, mantener tu sesión y sincronizar tus favoritos.</li>
        <li>Mostrar recomendaciones, rutas y clima según tu ubicación cuando lo solicitas.</li>
        <li>Evaluar el prototipo (metas de satisfacción y aceptación) y mejorar el servicio.</li>
        <li>Difundir la oferta turística de las comunidades de la Sierra Gorda.</li>
      </ul>
      <p>No vendemos ni compartimos tus datos con fines publicitarios.</p>
      <h2>Servicios de terceros</h2>
      <p>
        Para funcionar, XploraSG utiliza: Supabase (base de datos y autenticación, con cifrado AES-256 en reposo y TLS en tránsito), OpenStreetMap (mapas),
        Open-Meteo (clima) y OpenRouteService (cálculo de rutas, recibe sólo coordenadas de origen y destino). Al pulsar “Reservar / Contactar” se abre
        WhatsApp, que se rige por su propio aviso de privacidad. Si se configura un proveedor de inteligencia artificial, éste recibe únicamente el texto
        de tu pregunta y datos públicos del catálogo.
      </p>
      <h2>Almacenamiento en tu dispositivo</h2>
      <p>
        Usamos el almacenamiento local del navegador para mantener tu sesión, tus favoritos sin cuenta y una copia del catálogo para usarlo sin conexión.
        No usamos cookies publicitarias. La sesión se cierra automáticamente tras 15 minutos de inactividad.
      </p>
      <h2>Tus derechos (ARCO)</h2>
      <p>
        Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como revocar tu consentimiento,
        escribiendo a <strong>{CONTACT_EMAIL}</strong>. Responderemos en un plazo máximo de 20 días hábiles.
      </p>
      <h2>Cambios a este aviso</h2>
      <p>Cualquier cambio se publicará en esta misma página con su fecha de actualización.</p>
      <p className="text-sm">Consulta también los <Link to="/terminos" className="font-medium text-brand-green underline">Términos de uso</Link>.</p>
    </>
);

export const TermsPage = () => {
  const m = useMessages(legalMessages);
  const { lang } = useLanguage();
  usePageTitle(m.termsTitle);
  const CONTACT_EMAIL = CONTACT_EMAIL_ENV || m.contactPlaceholder;
  return (
    <LegalLayout eyebrow={m.termsEyebrow} title={m.termsTitle}>
      {lang === 'en' ? <TermsEn contactEmail={CONTACT_EMAIL} /> : <TermsEs contactEmail={CONTACT_EMAIL} />}
    </LegalLayout>
  );
};

const TermsEs = ({ contactEmail: CONTACT_EMAIL }: { contactEmail: string }) => (
    <>
      <p>Al usar XploraSG aceptas estas condiciones. Si no estás de acuerdo, te pedimos no utilizar la plataforma.</p>
      <h2>1. Naturaleza del servicio</h2>
      <p>
        XploraSG es un <strong>prototipo académico</strong> de difusión turística. La información de lugares, horarios, costos, eventos y servicios
        proviene de fuentes públicas y de los propios prestadores, y puede cambiar sin previo aviso. <strong>Confirma siempre</strong> horarios,
        accesos y condiciones antes de viajar.
      </p>
      <h2>2. Seguridad en tus visitas</h2>
      <p>
        Las actividades en ríos, cañones, cascadas y montaña implican riesgos. Atiende las indicaciones de guías locales y autoridades, consulta
        el clima y evita visitar estos sitios con lluvia o crecientes. XploraSG no se hace responsable de accidentes durante los recorridos.
      </p>
      <h2>3. Reservas y prestadores</h2>
      <p>
        Las reservas se acuerdan directamente con cada prestador (por ejemplo, por WhatsApp). XploraSG no cobra, no procesa pagos y no es parte
        de los acuerdos entre turistas y prestadores. Las promociones están sujetas a disponibilidad del prestador.
      </p>
      <h2>4. Cuentas</h2>
      <p>
        Eres responsable de la confidencialidad de tu cuenta. Las cuentas de prestador son otorgadas por el equipo de XploraSG y deben contener
        información veraz. Podemos suspender cuentas o contenidos que sean falsos, ofensivos o que pongan en riesgo a otras personas.
      </p>
      <h2>5. Respeto cultural y ambiental</h2>
      <p>
        Las misiones son templos en uso y Patrimonio Mundial; el arte rupestre y las zonas arqueológicas están protegidos por la ley. No extraigas
        materiales, no dejes residuos y respeta a las comunidades.
      </p>
      <h2>6. Propiedad intelectual</h2>
      <p>Las fotografías se usan con licencia o permiso de sus autores. Los textos y el código de XploraSG pertenecen a su equipo de desarrollo.</p>
      <h2>7. Contacto</h2>
      <p>Para dudas o reportes escribe a <strong>{CONTACT_EMAIL}</strong>. Consulta también el <Link to="/privacidad" className="font-medium text-brand-green underline">Aviso de privacidad</Link>.</p>
    </>
);

// ---- English version (courtesy translation; the Spanish text prevails) ----

const PrivacyEn = ({ contactEmail: CONTACT_EMAIL }: { contactEmail: string }) => (
    <>
      <p>
        The team behind <strong>XploraSG – Smart Tourism Platform for the Sierra Gorda</strong>, developed at the Jalpan Academic Unit as
        part of the Nuevos Talentos Científicos y Tecnológicos 2026 program, is responsible for processing the personal data you provide, in
        accordance with Mexico’s Federal Law on the Protection of Personal Data Held by Private Parties (LFPDPPP).
      </p>
      <h2>What data do we collect?</h2>
      <ul>
        <li><strong>Account (optional):</strong> name and email address. Your password is managed by Supabase Auth and stored encrypted (bcrypt hash); the team never has access to it.</li>
        <li><strong>Favorites:</strong> the places you save, linked to your account, or only on your device if you don’t sign in.</li>
        <li><strong>Location (optional):</strong> only when you tap “Use my location”. It is used at that moment to show nearby places, routes or the weather, and <strong>is not stored</strong>.</li>
        <li><strong>Satisfaction survey:</strong> anonymous answers; we don’t ask for your name or email.</li>
        <li><strong>Usage statistics:</strong> anonymous records (for example, “a place was viewed” or “someone searched for ‘waterfalls’”), with no IP address or personal identifiers.</li>
        <li><strong>Local businesses:</strong> public business information (name, contact details, hours, prices) that the business chooses to publish.</li>
      </ul>
      <h2>What do we use it for?</h2>
      <ul>
        <li>Creating your account, keeping you signed in and syncing your favorites.</li>
        <li>Showing recommendations, routes and weather based on your location when you ask for them.</li>
        <li>Evaluating the prototype (satisfaction and acceptance goals) and improving the service.</li>
        <li>Promoting the tourism offerings of the Sierra Gorda communities.</li>
      </ul>
      <p>We do not sell your data or share it for advertising purposes.</p>
      <h2>Third-party services</h2>
      <p>
        To work, XploraSG uses: Supabase (database and authentication, with AES-256 encryption at rest and TLS in transit), OpenStreetMap (maps),
        Open-Meteo (weather) and OpenRouteService (route planning, which receives only the start and end coordinates). Tapping “Book / Contact” opens
        WhatsApp, which is governed by its own privacy notice. If an artificial intelligence provider is configured, it receives only the text
        of your question and public catalog data.
      </p>
      <h2>Storage on your device</h2>
      <p>
        We use your browser’s local storage to keep you signed in, to store favorites without an account and to keep a copy of the catalog for offline use.
        We do not use advertising cookies. Your session ends automatically after 15 minutes of inactivity.
      </p>
      <h2>Your rights (ARCO)</h2>
      <p>
        You may request access to, rectification or cancellation of your data, object to its processing, or withdraw your consent,
        by writing to <strong>{CONTACT_EMAIL}</strong>. We will respond within a maximum of 20 business days.
      </p>
      <h2>Changes to this notice</h2>
      <p>Any changes will be posted on this page along with the date they were made.</p>
      <p className="text-sm">See also the <Link to="/terminos" className="font-medium text-brand-green underline">Terms of use</Link>.</p>
    </>
);

const TermsEn = ({ contactEmail: CONTACT_EMAIL }: { contactEmail: string }) => (
    <>
      <p>By using XploraSG you agree to these terms. If you do not agree, please do not use the platform.</p>
      <h2>1. Nature of the service</h2>
      <p>
        XploraSG is an <strong>academic prototype</strong> for promoting tourism. Information about places, hours, prices, events and services
        comes from public sources and from the businesses themselves, and may change without notice. <strong>Always confirm</strong> hours,
        access and conditions before you travel.
      </p>
      <h2>2. Safety on your visits</h2>
      <p>
        Activities in rivers, canyons, waterfalls and mountains involve risks. Follow the instructions of local guides and authorities, check
        the weather and avoid visiting these sites during rain or flash floods. XploraSG is not responsible for accidents during your outings.
      </p>
      <h2>3. Bookings and local businesses</h2>
      <p>
        Bookings are arranged directly with each business (for example, via WhatsApp). XploraSG does not charge fees, process payments or take part
        in agreements between tourists and businesses. Promotions are subject to each business’s availability.
      </p>
      <h2>4. Accounts</h2>
      <p>
        You are responsible for keeping your account confidential. Local business accounts are granted by the XploraSG team and must contain
        truthful information. We may suspend accounts or content that are false, offensive or that put other people at risk.
      </p>
      <h2>5. Cultural and environmental respect</h2>
      <p>
        The missions are active places of worship and World Heritage Sites; rock art and archaeological zones are protected by law. Do not remove
        materials, do not leave trash behind, and respect the communities.
      </p>
      <h2>6. Intellectual property</h2>
      <p>Photographs are used under license or with their authors’ permission. XploraSG’s texts and code belong to its development team.</p>
      <h2>7. Contact</h2>
      <p>For questions or reports, write to <strong>{CONTACT_EMAIL}</strong>. See also the <Link to="/privacidad" className="font-medium text-brand-green underline">Privacy notice</Link>.</p>
    </>
);
