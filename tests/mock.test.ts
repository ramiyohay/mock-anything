import { describe, it, expect } from "vitest";
import { mock } from "../src";

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
});
