import { useCallback, useEffect, useState } from "react";

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
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voice, rate, pitch, volume, lang]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
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

  return { speak, cancel, pause, resume, isSpeaking, isPaused, voices, isSupported };
}
