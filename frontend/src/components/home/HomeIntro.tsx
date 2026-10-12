// Declaración editorial en serif + cuatro razones en lista con filetes finos e iconos de línea.
import type { ReactNode } from 'react';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { BirdMark, ShieldIcon, WifiOffIcon } from '../brand/icons';

const ChatIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 19.5 5.6 16A7.5 7.5 0 1 1 8.4 18.6Z" />
    <path d="M9 11.5h6M9 8.5h4" />
  </svg>
);

export const HomeIntro = () => {
  const m = useMessages(homeMessages);
  const items: Array<{ key: string; title: string; text: string; icon: ReactNode }> = [
    { key: 'verified', title: m.verifiedTitle, text: m.verifiedText, icon: <ShieldIcon className="size-5" strokeWidth={1.4} /> },
    { key: 'offline', title: m.offlineTitle, text: m.offlineText, icon: <WifiOffIcon className="size-5" strokeWidth={1.4} /> },
    { key: 'whatsapp', title: m.whatsappTitle, text: m.whatsappText, icon: <ChatIcon /> },
    { key: 'assistant', title: m.assistantTitle, text: m.assistantText, icon: <BirdMark className="size-6" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24" aria-labelledby="home-simple">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="eyebrow">{m.simpleEyebrow}</p>
          <p className="font-display mt-6 text-[1.75rem] leading-[1.25] text-brand-blue sm:text-[2.1rem] lg:max-w-[34rem] lg:text-[2.5rem] lg:leading-[1.18]">
            {m.introLead} <em className="italic text-brand-green">{m.introEmphasis}</em>
          </p>
        </div>

        <div className="lg:col-span-5 lg:pt-12">
          <h2 id="home-simple" className="text-xl text-brand-blue">{m.simpleTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-brand-blue/70">{m.simpleText}</p>
          <ul className="mt-6 border-t border-brand-sand">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 border-b border-brand-sand py-5">
                <span className="mt-0.5 shrink-0 text-brand-green">{item.icon}</span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium text-brand-blue">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-brand-blue/70">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
