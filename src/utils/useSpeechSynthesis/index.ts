import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  isSupported: boolean;
}

/**
 * Internal, non-public handle exposing the live utterance reference held by the
 * hook. Keyed by a module-private symbol so it never appears on the typed public
 * API, in object spreads, or in enumeration — it exists purely so tests can
 * assert the GC-protection contract (that an active utterance is retained while
 * speaking and released on end/error/cancel). Consumers cannot reach it.
 */
export const INTERNAL_UTTERANCE_REF = Symbol('reactilities.useSpeechSynthesis.utteranceRef');

/**
 * Hook for text-to-speech via the Web Speech Synthesis API
 * Provides controls to speak, pause, resume, and cancel speech
 * Returns available voices for language/accent selection
 *
 * @param options.voice - Specific voice to use (from the voices array)
 * @param options.rate - Speech rate, 0.1 to 10 (default: 1)
 * @param options.pitch - Speech pitch, 0 to 2 (default: 1)
 * @param options.volume - Speech volume, 0 to 1 (default: 1)
 * @param options.lang - Language code, e.g. 'en-US' (default: browser default)
 * @returns Object with control functions, state, and available voices
 *
 * @example
 * function TextToSpeech({ text }: { text: string }) {
 *   const { speak, cancel, isSpeaking, voices } = useSpeechSynthesis();
 *
 *   return (
 *     <div>
 *       <button onClick={() => speak(text)} disabled={isSpeaking}>Read aloud</button>
 *       <button onClick={cancel} disabled={!isSpeaking}>Stop</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Custom voice selection
 * const { speak, voices } = useSpeechSynthesis({ rate: 1.2, pitch: 0.9 });
 * const englishVoice = voices.find(v => v.lang === 'en-US');
 * speak('Hello world');
 */
export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const { voice = null, rate = 1, pitch = 1, volume = 1, lang } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  // Hold a live reference to the active utterance for the duration of speech.
  // Without this, Chrome can garbage-collect a fire-and-forget utterance
  // mid-speech (crbug.com/679437), after which onend never fires and
  // isSpeaking would stay stuck at true forever.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (lang) utterance.lang = lang;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { utteranceRef.current = null; setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { utteranceRef.current = null; setIsSpeaking(false); setIsPaused(false); };

    // Retain the utterance so it cannot be collected while it is speaking.
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voice, rate, pitch, volume, lang]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (isSupported && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const api: UseSpeechSynthesisReturn = { speak, cancel, pause, resume, isSpeaking, isPaused, voices, isSupported };

  // Non-enumerable, symbol-keyed test hook onto the live utterance ref. Invisible
  // to spreads/enumeration and absent from the typed public API; lets tests verify
  // the utterance is retained while speaking and released on end/error/cancel.
  Object.defineProperty(api, INTERNAL_UTTERANCE_REF, {
    value: utteranceRef,
    enumerable: false,
    configurable: true,
  });

  return api;
}
