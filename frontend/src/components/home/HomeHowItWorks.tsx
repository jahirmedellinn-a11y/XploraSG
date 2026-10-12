// "Cómo funciona" sobre una banda crema: tres pasos con numerales en serif y filetes finos.
// Sin botón propio: el paso 02 ya presenta a Chatboot y el botón flotante está siempre a mano.
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';

export const HomeHowItWorks = () => {
  const m = useMessages(homeMessages);
  const steps = [
    { title: m.howStep1, text: m.howStep1Text },
    { title: m.howStep2, text: m.howStep2Text },
    { title: m.howStep3, text: m.howStep3Text },
  ];

  return (
    <section className="bg-brand-light" aria-labelledby="home-how">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <p className="eyebrow">{m.howEyebrow}</p>
        <h2 id="home-how" className="section-title mt-5">{m.howTitle}</h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-5 border-t border-brand-blue/15 pt-6 md:block">
              <span aria-hidden="true" className="font-display block w-12 shrink-0 text-4xl font-normal leading-none text-brand-gold md:w-auto md:text-5xl lg:text-6xl">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl text-brand-blue sm:text-2xl md:mt-6">{step.title}</h3>
                <p className="mt-2 max-w-sm text-[15px] leading-7 text-brand-blue/75">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
