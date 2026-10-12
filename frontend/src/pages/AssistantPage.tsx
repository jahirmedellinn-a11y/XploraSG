import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLanguage, useMessages } from '../i18n';
import { assistantMessages } from '../i18n/assistant';
import { AssistantChat, type AssistantChatHandle } from '../components/assistant/AssistantChat';
import { ArrowRightIcon, BirdMark } from '../components/brand/icons';
import { ItalicTail } from '../components/home/HomeUi';

// Vista completa de Chatboot (también accesible desde el botón flotante → "pantalla completa").
// Columna editorial con los accesos rápidos (envían la pregunta a la conversación) y la libreta del chat.
export const AssistantPage = () => {
  const m = useMessages(assistantMessages);
  const { lang } = useLanguage();
  const chat = useRef<AssistantChatHandle>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  usePageTitle(m.pageTitle, m.pageDescription);

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-24">
      {/* Columna editorial */}
      <div className="lg:sticky lg:top-28 lg:col-span-5 lg:h-fit lg:pr-8">
        <p className="eyebrow">{m.eyebrow}</p>
        <h1 className="mt-5 text-[2.5rem] leading-[1.04] text-brand-blue sm:text-5xl lg:text-[3.5rem]">
          <ItalicTail text={m.title} words={lang === 'en' ? 3 : 2} />
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-brand-blue/75">{m.intro}</p>

        <h2 className="mt-12 font-sans label-quiet">{m.shortcuts}</h2>
        <ul className="mt-4 border-b border-brand-sand">
          {m.starters.map((text) => (
            <li key={text} className="border-t border-brand-sand">
              <button
                type="button"
                onClick={() => chat.current?.ask(text)}
                className="group flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-display text-lg leading-snug text-brand-blue underline decoration-transparent underline-offset-4 transition-colors duration-300 group-hover:decoration-brand-green/50">{text}</span>
                <ArrowRightIcon className="size-4 shrink-0 text-brand-blue/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-green" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversación */}
      <div className="flex h-[min(80vh,760px)] min-h-[540px] flex-col overflow-hidden rounded-xl border border-brand-blue/15 bg-brand-paper lg:col-span-7">
        <header className="flex items-center gap-3 border-b border-brand-sand bg-brand-light px-5 py-4 sm:px-8">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-brand-sand bg-brand-paper text-brand-blue" aria-hidden="true"><BirdMark className="size-8" /></span>
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight text-brand-blue">{m.chatName}</p>
            <p className="label-quiet mt-0.5 flex items-center gap-1.5 truncate">
              <i className={`size-1.5 shrink-0 rounded-full ${online ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
              {online ? m.statusOnline : m.statusOffline}
            </p>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <AssistantChat ref={chat} variant="page" />
        </div>
      </div>
    </section>
  );
};
