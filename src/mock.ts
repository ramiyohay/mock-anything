import { registerRestore, unregisterRestore } from "./restoreAll";

export function mock<T extends object, K extends keyof T>(target: T, key: K) {
  // Save original method
  const original = target[key];

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

  // onCall (by call index)
  const onCallMap = new Map<number, (...args: any[]) => any>();

  // pending mode (consumed by next returns / throws / resolves)
  type PendingMode =
    | { type: "once" }
    | { type: "times"; count: number }
    | { type: "onCall"; index: number }
    | null;

  let pendingMode: PendingMode = null;

  // withArgs rules
  const argRules: Array<{
    args: any[];
    impl: (...args: any[]) => any;
  }> = [];

  function argsMatch(a: any[], b: any[]) {
    return (
      a.length === b.length &&
      a.every((value, index) => Object.is(value, b[index]))
    );
  }

  function mocker(this: any, ...args: any[]) {
    callCount++;
    callArgs.push(args);

    // onCall (highest priority)
    if (onCallMap.has(callCount)) {
      return onCallMap.get(callCount)!.apply(this, args);
    }

    // once
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

  target[key] = mocker as T[K];

  // stable restore function (used by restoreAll)
  const restoreFn = () => {
    target[key] = original;
  };

  registerRestore(restoreFn);

  return {
    // apply once
    once() {
      pendingMode = { type: "once" };

      return this;
    },

    // apply N times
    times(n: number) {
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error("times(n) expects a positive integer");
      }

      pendingMode = { type: "times", count: n };

      return this;
    },

    // apply on specific call index (1-based)
    onCall(n: number) {
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error("onCall(n) expects a positive integer");
      }

      pendingMode = { type: "onCall", index: n };

      return this;
    },

    // argument-based behavior
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

    // return value
    returns(value: any) {
      if (pendingMode?.type === "onCall") {
        onCallMap.set(pendingMode.index, () => value);
        pendingMode = null;
      } else if (pendingMode?.type === "once") {
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
      if (pendingMode?.type === "onCall") {
        onCallMap.set(pendingMode.index, () => {
          throw error;
        });

        pendingMode = null;
      } else if (pendingMode?.type === "once") {
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
      if (pendingMode?.type === "onCall") {
        onCallMap.set(pendingMode.index, () => Promise.resolve(value));
        pendingMode = null;
      } else if (pendingMode?.type === "once") {
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

    // reset internal state (keep mock active)
    reset() {
      callCount = 0;
      callArgs.length = 0;
      onceImplementation = null;
      timesRemaining = null;
      timesImplementation = null;
      pendingMode = null;

      onCallMap.clear();

      return this;
    },

    // number of calls
    called() {
      return callCount;
    },

    // arguments of each call
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
