// Voz manos libres para Chatboot con la Web Speech API del navegador:
// dictado con SpeechRecognition y lectura de respuestas con speechSynthesis.
// Todo es opcional: si el navegador no lo soporta, los botones no aparecen.
import { useCallback, useEffect, useRef, useState } from 'react';

interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface RecognitionErrorEvent { error: string }
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export type DictationError = 'denied' | 'no-speech' | 'network' | 'other';

const SPEAK_KEY = 'xplora:chatboot-voz';
const readSpeakPreference = () => {
  try { return localStorage.getItem(SPEAK_KEY) === '1'; } catch { return false; }
};

/** Quita viñetas y saltos para que la lectura en voz alta suene natural. */
const speakable = (text: string) => text.replace(/^[•\-\d.]+\s*/gm, '').replace(/\s*\n+\s*/g, '. ').replace(/\.{2,}/g, '.').trim();

interface UseVoiceOptions {
  lang: 'es' | 'en';
  /** Se llama con el texto final dictado (manos libres: se envía solo). */
  onFinal: (text: string) => void;
  /** Texto parcial mientras la persona habla. */
  onInterim?: (text: string) => void;
}

export const useVoice = ({ lang, onFinal, onInterim }: UseVoiceOptions) => {
  const locale = lang === 'en' ? 'en-US' : 'es-MX';
  const canDictate = recognitionCtor() !== null;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const [listening, setListening] = useState(false);
  const [dictationError, setDictationError] = useState<DictationError | null>(null);
  const [speakReplies, setSpeakReplies] = useState(() => canSpeak && readSpeakPreference());
  const [speaking, setSpeaking] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const callbacks = useRef({ onFinal, onInterim });
  useEffect(() => {
    callbacks.current = { onFinal, onInterim };
  });

  const stopDictation = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const startDictation = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    if (canSpeak) window.speechSynthesis.cancel();
    recognition.current?.abort();
    const instance = new Ctor();
    instance.lang = locale;
    instance.interimResults = true;
    instance.continuous = false;
    instance.maxAlternatives = 1;
    let finalText = '';
    instance.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      callbacks.current.onInterim?.((finalText + interim).trim());
    };
    instance.onerror = (event) => {
      setDictationError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'denied'
          : event.error === 'no-speech' ? 'no-speech'
            : event.error === 'network' ? 'network'
              : event.error === 'aborted' ? null : 'other',
      );
    };
    instance.onend = () => {
      setListening(false);
      recognition.current = null;
      const clean = finalText.trim();
      if (clean) callbacks.current.onFinal(clean);
    };
    recognition.current = instance;
    setDictationError(null);
    setListening(true);
    try {
      instance.start();
    } catch {
      setListening(false);
      setDictationError('other');
    }
  }, [canSpeak, locale]);

  const speak = useCallback((text: string) => {
    if (!canSpeak || !text.trim()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(speakable(text));
    utterance.lang = locale;
    const voice = synth.getVoices().find((item) => item.lang?.toLowerCase().startsWith(lang));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }, [canSpeak, lang, locale]);

  const toggleSpeakReplies = useCallback(() => {
    setSpeakReplies((current) => {
      const next = !current;
      try { localStorage.setItem(SPEAK_KEY, next ? '1' : '0'); } catch { /* sin almacenamiento */ }
      if (!next && canSpeak) window.speechSynthesis.cancel();
      return next;
    });
  }, [canSpeak]);

  // Al cerrar el chat se detiene cualquier dictado o lectura en curso.
  useEffect(() => () => {
    recognition.current?.abort();
    if (canSpeak) window.speechSynthesis.cancel();
  }, [canSpeak]);

  return {
    canDictate, canSpeak, listening, dictationError, speaking, speakReplies,
    startDictation, stopDictation, speak, toggleSpeakReplies,
    clearDictationError: () => setDictationError(null),
  };
};
