# mock-anything

https://www.npmjs.com/package/mock-anything


Tiny TypeScript utility to **temporarily replace a method on an object and restore it**.

No test framework.  
No module mocking.  
No magic.

check **example.js** for more examples :)

Questions or issues?
Open an issue on GitHub – happy to help.

---

## ✨ What is this?

`mock-anything` lets you override a function **explicitly and safely**:

- return values (sync)
- throw errors
- resolve promises (async)
- apply behavior once (`once`)
- apply behavior multiple times (`times`)
- apply behavior based on arguments (`withArgs`)
- inspect call count and arguments (`called`, `calledArgs`)
- restore the original function
- restore all mocks at once (`restoreAll`)

Perfect for:
- scripts
- tools
- small tests
- POCs
- Node utilities

---

## ❌ What this is NOT

- ❌ Not a test framework
- ❌ Not module/import mocking
- ❌ Not a Jest/Sinon replacement
- ❌ No globals, no loaders

You must have access to the object + method reference.

---

## 📦 Install

```bash
npm install mock-anything
```

---

## 🚀 Basic Usage

```ts
import { mock } from "mock-anything";

const api = {
  getUser() {
    return { id: 1 };
  },
};

const m = mock(api, "getUser").returns({ id: 42 });

api.getUser(); // { id: 42 }
api.getUser(); // { id: 42 }

console.log(m.called()); // 2

m.restore();

api.getUser(); // { id: 1 }
```

---

## 🔁 Async example

```ts
const api = {
  async fetchUser() {
    return { id: 1 };
  },
};

const m = mock(api, "fetchUser").resolves({ id: 99 });

await api.fetchUser(); // { id: 99 }

m.restore();
```

---

## 🔂 once()

Apply behavior **only on the first call**.

```ts
mock(api, "fetch")
  .once().throws(new Error("timeout"))
  .returns("ok");

api.fetch(); // throws
api.fetch(); // "ok"
api.fetch(); // "ok"
```

---

## 🎯 withArgs()

Apply behavior **based on arguments**.

```ts
mock(api, "calc")
  .withArgs(1, 2).returns(3)
  .withArgs(2, 2).returns(4)
  .returns(0); // fallback

api.calc(1, 2); // 3
api.calc(2, 2); // 4
api.calc(9, 9); // 0
```

Works with async too:

```ts
mock(api, "fetchUser")
  .withArgs(1).resolves({ id: 100 })
  .withArgs(2).resolves({ id: 200 })
  .resolves({ id: -1 });
```

---

## 📊 API

```ts
mock(target, key)
  .returns(value)
  .throws(error)
  .resolves(value)
  .once()
  .withArgs(...args)
  .called()
  .restore();
```

---

## 🧠 Design principles

- Explicit > magic
- Small API surface
- Safe monkey-patching
- Easy to reason about
- Easy to remove

---

## 📜 License

MIT
