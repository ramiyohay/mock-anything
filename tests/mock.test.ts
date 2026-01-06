import { describe, it, expect } from "vitest";
import { mock, restoreAll } from "../src";

describe("mock()", () => {
  describe("basic behavior", () => {
    it("returns a mocked value", () => {
      const obj = {
        sum(a: number, b: number) {
          return a + b;
        },
      };

      const m = mock(obj, "sum").returns(10);

      expect(obj.sum(1, 2)).toBe(10);
      expect(obj.sum(5, 6)).toBe(10);
      expect(m.called()).toBe(2);

      m.restore();
      expect(obj.sum(1, 2)).toBe(3);
    });

    it("throws an error", () => {
      const obj = {
        fn() {
          return "ok";
        },
      };

      const error = new Error("fail");
      const m = mock(obj, "fn").throws(error);

      expect(() => obj.fn()).toThrow("fail");
      expect(m.called()).toBe(1);

      m.restore();
      expect(obj.fn()).toBe("ok");
    });
  });

  describe("async behavior", () => {
    it("resolves async value", async () => {
      const obj = {
        async fetch() {
          return "real";
        },
      };

      const m = mock(obj, "fetch").resolves("mocked");

      await expect(obj.fetch()).resolves.toBe("mocked");
      expect(m.called()).toBe(1);

      m.restore();
      await expect(obj.fetch()).resolves.toBe("real");
    });
  });

  describe("once()", () => {
    it("applies behavior only to first call", () => {
      const obj = {
        get() {
          return "real";
        },
      };

      const m = mock(obj, "get").once().returns("first").returns("next");

      expect(obj.get()).toBe("first");
      expect(obj.get()).toBe("next");
      expect(obj.get()).toBe("next");
      expect(m.called()).toBe(3);

      m.restore();
      expect(obj.get()).toBe("real");
    });

    it("can throw once and then recover", () => {
      const obj = {
        load() {
          return "ok";
        },
      };

      const m = mock(obj, "load")
        .once()
        .throws(new Error("fail"))
        .returns("success");

      expect(() => obj.load()).toThrow("fail");
      expect(obj.load()).toBe("success");
      expect(obj.load()).toBe("success");
      expect(m.called()).toBe(3);

      m.restore();
      expect(obj.load()).toBe("ok");
    });
  });

  describe("withArgs()", () => {
    it("returns different values based on arguments", () => {
      const api = {
        calc(a: number, b: number) {
          return a + b;
        },
      };

      const m = mock(api, "calc")
        .withArgs(1, 2)
        .returns(3)
        .withArgs(2, 2)
        .returns(4)
        .returns(0); // fallback

      expect(api.calc(1, 2)).toBe(3);
      expect(api.calc(2, 2)).toBe(4);
      expect(api.calc(9, 9)).toBe(0);
      expect(m.called()).toBe(3);

      m.restore();
      expect(api.calc(1, 2)).toBe(3);
    });

    it("supports async resolves withArgs", async () => {
      const api = {
        async fetchUser(id: number) {
          return { id };
        },
      };

      const m = mock(api, "fetchUser")
        .withArgs(1)
        .resolves({ id: 100 })
        .withArgs(2)
        .resolves({ id: 200 })
        .resolves({ id: -1 });

      await expect(api.fetchUser(1)).resolves.toEqual({ id: 100 });
      await expect(api.fetchUser(2)).resolves.toEqual({ id: 200 });
      await expect(api.fetchUser(999)).resolves.toEqual({ id: -1 });

      expect(m.called()).toBe(3);

      m.restore();
      await expect(api.fetchUser(5)).resolves.toEqual({ id: 5 });
    });

    it("works together with once()", () => {
      const api = {
        get(value?: string) {
          return value ?? "real";
        },
      };

      const m = mock(api, "get")
        .once()
        .returns("first")
        .withArgs("a")
        .returns("A")
        .returns("fallback");

      expect(api.get()).toBe("first"); // once
      expect(api.get("a")).toBe("A"); // withArgs
      expect(api.get()).toBe("fallback"); // default

      expect(m.called()).toBe(3);

      m.restore();
      expect(api.get()).toBe("real");
    });

    it("falls back when args do not match exactly", () => {
      const api = {
        fn(a: number) {
          return a;
        },
      };

      const m = mock(api, "fn").withArgs(1).returns(10).returns(0);

      expect(api.fn(1)).toBe(10);
      expect(api.fn(2)).toBe(0);

      m.restore();
    });
  });

  describe("times()", () => {
    it("applies behavior N times and then falls back", () => {
      const api = {
        fetch() {
          return "real";
        },
      };

      const m = mock(api, "fetch").times(2).returns("temp").returns("final");

      expect(api.fetch()).toBe("temp"); // 1
      expect(api.fetch()).toBe("temp"); // 2
      expect(api.fetch()).toBe("final"); // fallback
      expect(api.fetch()).toBe("final");

      expect(m.called()).toBe(4);

      m.restore();
      expect(api.fetch()).toBe("real");
    });

    it("works with throws()", () => {
      const api = {
        load() {
          return "ok";
        },
      };

      const m = mock(api, "load")
        .times(1)
        .throws(new Error("fail"))
        .returns("success");

      expect(() => api.load()).toThrow("fail");
      expect(api.load()).toBe("success");
      expect(api.load()).toBe("success");

      expect(m.called()).toBe(3);

      m.restore();
      expect(api.load()).toBe("ok");
    });

    it("works with resolves()", async () => {
      const api = {
        async fetch() {
          return "real";
        },
      };

      const m = mock(api, "fetch").times(2).resolves("temp").resolves("final");

      await expect(api.fetch()).resolves.toBe("temp");
      await expect(api.fetch()).resolves.toBe("temp");
      await expect(api.fetch()).resolves.toBe("final");

      expect(m.called()).toBe(3);

      m.restore();
      await expect(api.fetch()).resolves.toBe("real");
    });

    it("times() has lower priority than once()", () => {
      const api = {
        fn() {
          return "real";
        },
      };

      const m = mock(api, "fn")
        .once()
        .returns("once")
        .times(2)
        .returns("temp")
        .returns("final");

      expect(api.fn()).toBe("once"); // once
      expect(api.fn()).toBe("temp"); // times 1
      expect(api.fn()).toBe("temp"); // times 2
      expect(api.fn()).toBe("final"); // fallback

      expect(m.called()).toBe(4);

      m.restore();
      expect(api.fn()).toBe("real");
    });

    it("throws on invalid times(n)", () => {
      const api = {
        fn() {
          return "real";
        },
      };

      expect(() => mock(api, "fn").times(0)).toThrow();
      expect(() => mock(api, "fn").times(-1)).toThrow();
      expect(() => mock(api, "fn").times(1.5)).toThrow();
    });
  });

  describe("calledArgs()", () => {
    it("returns arguments of all calls", () => {
      const api = {
        calc(a: number, b: number) {
          return a + b;
        },
      };

      const m = mock(api, "calc").returns(0);

      api.calc(1, 2);
      api.calc(3, 4);
      api.calc(5, 6);

      expect(m.calledArgs()).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);

      expect(m.called()).toBe(3);

      m.restore();
    });

    it("works with once and times", () => {
      const api = {
        fn(x: number) {
          return x;
        },
      };

      const m = mock(api, "fn")
        .once()
        .returns(10)
        .times(2)
        .returns(20)
        .returns(30);

      api.fn(1);
      api.fn(2);
      api.fn(3);
      api.fn(4);

      expect(m.calledArgs()).toEqual([[1], [2], [3], [4]]);

      m.restore();
    });
  });

  describe("restoreAll()", () => {
    it("restores all mocks at once", () => {
      const a = {
        fn() {
          return "a";
        },
      };

      const b = {
        fn() {
          return "b";
        },
      };

      mock(a, "fn").returns("mock-a");
      mock(b, "fn").returns("mock-b");

      expect(a.fn()).toBe("mock-a");
      expect(b.fn()).toBe("mock-b");

      restoreAll();

      expect(a.fn()).toBe("a");
      expect(b.fn()).toBe("b");
    });
  });
});
