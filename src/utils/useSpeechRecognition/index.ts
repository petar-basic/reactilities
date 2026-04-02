import { useCallback, useEffect, useRef, useState } from "react";

// SpeechRecognition is not in all TS lib versions — define a minimal interface
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

/**
 * Hook for voice input via the Web Speech Recognition API
 * Returns real-time interim transcripts as the user speaks and final transcripts on pause
 *
 * @param options.lang - Recognition language, e.g. 'en-US' (default: 'en-US')
 * @param options.continuous - Keep listening after each result (default: false)
 * @param options.interimResults - Emit interim (unfinished) transcripts (default: true)
 * @param options.onResult - Callback with each transcript result and whether it is final
 * @param options.onError - Callback with the error string when recognition fails
 * @returns Object with transcript state and start/stop/reset controls
 *
 * @example
 * function VoiceSearch() {
 *   const { transcript, isListening, start, stop, reset } = useSpeechRecognition();
 *
 *   return (
 *     <div>
 *       <input value={transcript} readOnly placeholder="Speak to search..." />
 *       <button onClick={isListening ? stop : start}>
 *         {isListening ? 'Stop' : 'Start'}
 *       </button>
 *       <button onClick={reset}>Clear</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Continuous transcription with callbacks
 * const { transcript, start } = useSpeechRecognition({
 *   lang: 'fr-FR',
 *   continuous: true,
 *   onResult: (text, isFinal) => isFinal && saveLine(text)
 * });
 */
export function useSpeechRecognition({
  lang = 'en-US',
  continuous = false,
  interimResults = true,
  onResult,
  onError
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => getSpeechRecognitionAPI() !== null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI || isListeningRef.current) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        onResultRef.current?.(final, true);
      }

      setInterimTranscript(interim);
      if (interim) {
        onResultRef.current?.(interim, false);
      }
    };

    recognition.onstart = () => { isListeningRef.current = true; setIsListening(true); };
    recognition.onend = () => { isListeningRef.current = false; setIsListening(false); setInterimTranscript(''); };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isListeningRef.current = false;
      setIsListening(false);
      onErrorRef.current?.(event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, continuous, interimResults]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setTranscript('');
    setInterimTranscript('');
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return { transcript, interimTranscript, isListening, isSupported, start, stop, reset };
}
