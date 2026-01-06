import { registerRestore, unregisterRestore } from "./restoreAll";

export function mock<T extends object, K extends keyof T>(target: T, key: K) {
  // Save original method
  const original = target[key];

  // Ensure the original is a function
  if (typeof original !== "function") {
    throw new Error(`${String(key)} is not a function`);
  }

  let callCount = 0;
  const callArgs: any[][] = [];

  // default behavior
  let implementation: (...args: any[]) => any = () => undefined;

  // once
  let onceImplementation: ((...args: any[]) => any) | null = null;

  // times
  let timesRemaining: number | null = null;
  let timesImplementation: ((...args: any[]) => any) | null = null;

  // pending mode (consumed by next returns / throws / resolves)
  type PendingMode = { type: "once" } | { type: "times"; count: number } | null;
  let pendingMode: PendingMode = null;

  // withArgs rules
  const argRules: Array<{
    args: any[];
    impl: (...args: any[]) => any;
  }> = [];

  // Helper to compare arguments
  function argsMatch(a: any[], b: any[]) {
    return (
      a.length === b.length &&
      a.every((value, index) => Object.is(value, b[index]))
    );
  }

  // The mocker function that replaces the original
  function mocker(this: any, ...args: any[]) {
    callCount++;
    callArgs.push(args);

    // once (highest priority)
    if (onceImplementation) {
      const fn = onceImplementation;

      onceImplementation = null;

      return fn.apply(this, args);
    }

    // times
    if (timesRemaining !== null && timesRemaining > 0 && timesImplementation) {
      timesRemaining--;

      return timesImplementation.apply(this, args);
    }

    // withArgs
    for (const rule of argRules) {
      if (argsMatch(rule.args, args)) {
        return rule.impl.apply(this, args);
      }
    }

    // default
    return implementation.apply(this, args);
  }

  // Replace original method
  target[key] = mocker as T[K];

  // Stable restore function (used by restoreAll)
  const restoreFn = () => {
    target[key] = original;
  };

  // Register this mock
  registerRestore(restoreFn);

  return {
    // run once
    once() {
      pendingMode = { type: "once" };

      return this;
    },

    // run N times
    times(n: number) {
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error("times(n) expects a positive integer");
      }

      pendingMode = { type: "times", count: n };

      return this;
    },

    // with specific arguments
    withArgs(...expectedArgs: any[]) {
      return {
        returns: (value: any) => {
          argRules.push({
            args: expectedArgs,
            impl: () => value,
          });

          return this;
        },

        throws: (error: Error) => {
          argRules.push({
            args: expectedArgs,
            impl: () => {
              throw error;
            },
          });

          return this;
        },

        resolves: (value: any) => {
          argRules.push({
            args: expectedArgs,
            impl: () => Promise.resolve(value),
          });

          return this;
        },
      };
    },

    // set return value
    returns(value: any) {
      if (pendingMode?.type === "once") {
        onceImplementation = () => value;
        pendingMode = null;
      } else if (pendingMode?.type === "times") {
        timesRemaining = pendingMode.count;
        timesImplementation = () => value;
        pendingMode = null;
      } else {
        implementation = () => value;
      }

      return this;
    },

    // throw error
    throws(error: Error) {
      if (pendingMode?.type === "once") {
        onceImplementation = () => {
          throw error;
        };

        pendingMode = null;
      } else if (pendingMode?.type === "times") {
        timesRemaining = pendingMode.count;
        timesImplementation = () => {
          throw error;
        };

        pendingMode = null;
      } else {
        implementation = () => {
          throw error;
        };
      }

      return this;
    },

    // resolve promise
    resolves(value: any) {
      if (pendingMode?.type === "once") {
        onceImplementation = () => Promise.resolve(value);
        pendingMode = null;
      } else if (pendingMode?.type === "times") {
        timesRemaining = pendingMode.count;
        timesImplementation = () => Promise.resolve(value);
        pendingMode = null;
      } else {
        implementation = () => Promise.resolve(value);
      }

      return this;
    },

    // get number of calls
    called() {
      return callCount;
    },

    // get arguments of each call
    calledArgs() {
      return callArgs.slice();
    },

    // restore original method
    restore() {
      restoreFn();
      unregisterRestore(restoreFn);
    },
  };
}
