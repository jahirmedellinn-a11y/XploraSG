import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useMessages } from '../i18n';
import { aboutMessages } from '../i18n/about';
import { BrandLogo } from '../components/brand/BrandLogo';
import { CONTACT_EMAIL } from '../config/contact';
import { CommunityIcon, NatureIcon, SparkleIcon } from '../components/brand/icons';
import { ItalicTail, TextLink } from '../components/home/HomeUi';
import { PageHero } from '../components/ui/PageHero';

const extra = defineMessages({
  whoWeAre: 'Quiénes somos',
}, {
  whoWeAre: 'Who we are',
});

// "Sobre nosotros" (v3 · Editorial natural): titular en serif, la foto del equipo a lo ancho con pie de foto,
// manifiesto en serif, valores en columnas con filetes y llamada a colaborar sobre crema.
export const AboutUs = () => {
  const m = useMessages(aboutMessages);
  const x = useMessages(extra);
  usePageTitle(m.pageTitle, m.pageDescription);

  const values = [
    { Icon: SparkleIcon, title: m.valueTech, text: m.valueTechText },
    { Icon: NatureIcon, title: m.valueSustain, text: m.valueSustainText },
    { Icon: CommunityIcon, title: m.valueLocal, text: m.valueLocalText },
  ];

  return (
    <>
      <PageHero
        layout="stacked"
        eyebrow={m.eyebrow}
        title={<ItalicTail text={m.title} words={1} />}
        subtitle={m.missionText}
        image={{
          url: '/equipo/xplorasg-equipo-1600.webp',
          srcSet: '/equipo/xplorasg-equipo-800.webp 800w, /equipo/xplorasg-equipo-1600.webp 1600w',
          alt: m.photoAlt,
          position: '60% 35%',
        }}
        caption={m.photoCaption}
      />

      {/* Manifiesto */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="about-who">
        <div className="max-w-4xl">
          <h2 id="about-who" className="eyebrow font-sans">{x.whoWeAre}</h2>
          <p className="font-display mt-6 text-[1.5rem] leading-[1.4] text-brand-blue sm:text-[1.8rem] lg:text-[2rem] lg:leading-[1.35]">{m.intro}</p>
        </div>
      </section>

      {/* Valores en columnas con filetes */}
      <section className="bg-brand-light" aria-labelledby="about-values">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow">{m.missionTitle}</p>
          <h2 id="about-values" className="section-title mt-5"><ItalicTail text={m.valuesTitle} words={1} /></h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
            {values.map(({ Icon, title, text }, i) => (
              <article key={title} className="border-t border-brand-blue/70 pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm italic text-brand-gold" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className="size-5 text-brand-green" strokeWidth={1.4} />
                </div>
                <h3 className="font-display mt-6 text-2xl leading-tight text-brand-blue">{title}</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-7 text-brand-blue/75">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Proyecto académico + llamada a colaborar */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <BrandLogo variant="mark" className="h-12 w-auto" />
            <p className="eyebrow mt-8">{m.programTitle}</p>
            <p className="mt-5 text-[15px] leading-8 text-brand-blue/70">{m.programText}</p>
          </div>
          <div className="rounded-xl bg-brand-light px-6 py-10 sm:px-10 sm:py-12 lg:col-span-7 lg:col-start-6 lg:px-14 lg:py-14">
            <p className="eyebrow">{m.ctaEmail}</p>
            <h2 className="section-title mt-5">{m.ctaTitle}</h2>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-brand-blue/75 sm:text-base sm:leading-8">{m.ctaText}</p>
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary min-h-12 max-w-full px-6">
                <span className="truncate"><span className="max-sm:hidden">{m.ctaEmail} · </span>{CONTACT_EMAIL}</span>
              </a>
              <TextLink to="/explorar" className="self-start sm:self-auto">{m.ctaExplore}</TextLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
