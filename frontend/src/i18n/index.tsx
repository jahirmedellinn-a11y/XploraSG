/* eslint-disable react-refresh/only-export-components */
// Internacionalización ligera de XploraSG (español / inglés), sin dependencias externas.
//
// Uso en un componente:
//   const messages = defineMessages({ title: 'Hola', count: (n: number) => `${n} lugares` },
//                                   { title: 'Hello', count: (n: number) => `${n} places` });
//   const m = useMessages(messages);  →  m.title, m.count(3)
//
// TypeScript obliga a que la versión en inglés tenga exactamente las mismas claves que la española.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];
const STORAGE_KEY = 'xplora:lang';

const isLang = (value: unknown): value is Lang => value === 'es' || value === 'en';

/** Idioma inicial: ?lang= en la URL → preferencia guardada → idioma del navegador (español por defecto). */
const detectLang = (): Lang => {
  if (typeof window === 'undefined') return 'es';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLang(fromUrl)) return fromUrl;
  } catch { /* URL inválida: se ignora */ }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch { /* almacenamiento bloqueado */ }
  const browser = (navigator.languages?.[0] || navigator.language || 'es').toLowerCase();
  return browser.startsWith('es') ? 'es' : 'en';
};

// Copia a nivel de módulo para código que no es React (servicios de API, AuthContext).
let currentLang: Lang = detectLang();
export const getLang = (): Lang => currentLang;
export const localeFor = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es-MX');

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: currentLang, locale: localeFor(currentLang), setLang: () => {} });

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(currentLang);

  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* sin almacenamiento */ }
    setLangState(next);
  }, []);

  const value = useMemo(() => ({ lang, locale: localeFor(lang), setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] };

/** Declara los textos de una pantalla en ambos idiomas. */
export const defineMessages = <T extends Record<string, unknown>>(es: T, en: Widen<T>): Record<Lang, Widen<T>> => ({ es: es as Widen<T>, en });

/** Devuelve los textos en el idioma activo. */
export const useMessages = <T,>(bundle: Record<Lang, T>): T => bundle[useLanguage().lang];

/** Para código fuera de React. */
export const messagesNow = <T,>(bundle: Record<Lang, T>): T => bundle[currentLang];

/** Fecha en el idioma activo. */
export const formatDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions, lang: Lang = currentLang) =>
  new Intl.DateTimeFormat(localeFor(lang), options).format(new Date(value));
