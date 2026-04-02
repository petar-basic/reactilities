import { useCallback, useEffect, useRef, useState } from "react";

type FileReaderResult = string | ArrayBuffer | null;

interface UseFileReaderReturn {
  result: FileReaderResult;
  error: Error | null;
  loading: boolean;
  readAsText: (file: File, encoding?: string) => void;
  readAsDataURL: (file: File) => void;
  readAsArrayBuffer: (file: File) => void;
  reset: () => void;
}

/**
 * Hook for reading File objects using the FileReader API
 * Supports reading files as text, data URLs (base64), or ArrayBuffers
 * Tracks loading and error state during the read operation
 *
 * @returns Object with the read result, loading/error state, and reader methods.
 *   Calling reset() immediately aborts any in-progress read and clears all state.
 *
 * @example
 * function ImagePreview() {
 *   const { result, loading, readAsDataURL } = useFileReader();
 *
 *   return (
 *     <>
 *       <input
 *         type="file"
 *         accept="image/*"
 *         onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0])}
 *       />
 *       {loading && <span>Loading...</span>}
 *       {result && <img src={result as string} alt="Preview" />}
 *     </>
 *   );
 * }
 *
 * @example
 * // Read a JSON or CSV file as text
 * const { result, readAsText } = useFileReader();
 *
 * const handleFile = (file: File) => readAsText(file);
 *
 * useEffect(() => {
 *   if (result) parseCSV(result as string);
 * }, [result]);
 */
export function useFileReader(): UseFileReaderReturn {
  const [result, setResult] = useState<FileReaderResult>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const readerRef = useRef<FileReader | null>(null);

  useEffect(() => {
    return () => readerRef.current?.abort?.();
  }, []);

  const read = useCallback((
    file: File,
    method: 'readAsText' | 'readAsDataURL' | 'readAsArrayBuffer',
    encoding?: string
  ) => {
    readerRef.current?.abort?.();
    const reader = new FileReader();
    readerRef.current = reader;
    setLoading(true);
    setError(null);
    setResult(null);

    reader.onload = () => {
      setResult(reader.result);
      setLoading(false);
    };

    reader.onerror = () => {
      setError(new Error(`Failed to read file: ${file.name}`));
      setLoading(false);
    };

    if (method === 'readAsText') {
      reader.readAsText(file, encoding);
    } else if (method === 'readAsDataURL') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const readAsText = useCallback((file: File, encoding?: string) => {
    read(file, 'readAsText', encoding);
  }, [read]);

  const readAsDataURL = useCallback((file: File) => {
    read(file, 'readAsDataURL');
  }, [read]);

  const readAsArrayBuffer = useCallback((file: File) => {
    read(file, 'readAsArrayBuffer');
  }, [read]);

  const reset = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.onload = null;
      readerRef.current.onerror = null;
      readerRef.current?.abort?.();
      readerRef.current = null;
    }
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, error, loading, readAsText, readAsDataURL, readAsArrayBuffer, reset };
}
