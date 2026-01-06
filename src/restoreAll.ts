const activeRestores = new Set<() => void>();

// Register a restore function
export function registerRestore(fn: () => void) {
  activeRestores.add(fn);
}

// Unregister a restore function
export function unregisterRestore(fn: () => void) {
  activeRestores.delete(fn);
}

// Restore all mocks
export function restoreAll() {
  for (const restore of activeRestores) {
    restore();
  }

  activeRestores.clear();
}
