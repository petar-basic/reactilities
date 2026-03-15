import { useCallback, useReducer } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoRedoAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'SET':
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    case 'RESET':
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    default:
      return state;
  }
}

interface UseUndoRedoReturn<T> {
  state: T;
  set: (value: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (value: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  past: T[];
  future: T[];
}

/**
 * Hook for managing state with undo/redo history
 *
 * @param initialState - Initial value for the present state
 * @returns Object with current state and undo/redo controls
 *
 * @example
 * const { state, set, undo, redo, canUndo, canRedo } = useUndoRedo('hello');
 *
 * set('world');   // state = 'world', canUndo = true
 * undo();         // state = 'hello', canRedo = true
 * redo();         // state = 'world'
 */
export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [{ past, present, future }, dispatch] = useReducer(
    undoRedoReducer<T>,
    { past: [], present: initialState, future: [] }
  );

  const set = useCallback((value: T) => dispatch({ type: 'SET', payload: value }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const reset = useCallback((value: T) => dispatch({ type: 'RESET', payload: value }), []);

  return {
    state: present,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    past,
    future,
  };
}
