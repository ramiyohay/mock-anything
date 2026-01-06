export type UntilState = {
  predicate: () => boolean;
  impl: ((...args: any[]) => any) | null;
  maxCalls: number | null;
  hits: number;
};

// Create a new UntilState object
export function createUntilState(
  predicate: () => boolean,
  maxCalls: number | null
): UntilState {
  return {
    predicate,
    impl: null,
    maxCalls,
    hits: 0,
  };
}

// Check if the until condition is met
export function shouldApplyUntil(state: UntilState): boolean {
  return state.predicate();
}

// Apply the until behavior
export function applyUntil(state: UntilState, args: any[]) {
  state.hits++;

  if (state.maxCalls !== null && state.hits > state.maxCalls) {
    throw new Error(`until() exceeded maxCalls (${state.maxCalls})`);
  }

  if (!state.impl) {
    return undefined;
  }

  return state.impl(...args);
}

// Reset the hits counter
export function resetUntil(state: UntilState) {
  state.hits = 0;
}
