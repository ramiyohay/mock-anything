export function mock<T extends object, K extends keyof T>(target: T, key: K) {
  const original = target[key];

  if (typeof original !== "function") {
    throw new Error(`${String(key)} is not a function`);
  }

  let callCount = 0;

  // default behavior
  let implementation: (...args: any[]) => any = () => undefined;

  // once behavior
  let onceImplementation: ((...args: any[]) => any) | null = null;
  let onceMode = false;

  // withArgs rules
  const argRules: Array<{
    args: any[];
    impl: (...args: any[]) => any;
  }> = [];

  // helper to compare args
  function argsMatch(a: any[], b: any[]) {
    return (
      a.length === b.length &&
      a.every((value, index) => Object.is(value, b[index]))
    );
  }

  function mocker(this: any, ...args: any[]) {
    callCount++;

    // once (only on first call)
    if (callCount === 1 && onceImplementation) {
      return onceImplementation.apply(this, args);
    }

    // withArgs rules
    for (const rule of argRules) {
      if (argsMatch(rule.args, args)) {
        return rule.impl.apply(this, args);
      }
    }

    // default behavior
    return implementation.apply(this, args);
  }

  target[key] = mocker as T[K];

  return {
    once() {
      onceMode = true;
      
      return this;
    },

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

    returns(value: any) {
      if (onceMode) {
        onceImplementation = () => value;
        onceMode = false;
      } else {
        implementation = () => value;
      }

      return this;
    },

    throws(error: Error) {
      if (onceMode) {
        onceImplementation = () => {
          throw error;
        };

        onceMode = false;
      } else {
        implementation = () => {
          throw error;
        };
      }

      return this;
    },

    resolves(value: any) {
      if (onceMode) {
        onceImplementation = () => Promise.resolve(value);
        onceMode = false;
      } else {
        implementation = () => Promise.resolve(value);
      }
      return this;
    },

    called() {
      return callCount;
    },

    restore() {
      target[key] = original;
    },
  };
}
