import { mock, restoreAll } from "./src";

const service = {
  getUser(id?: number) {
    return { id: id ?? 1 };
  },

  async fetchUser(id?: number) {
    return { id: id ?? 1 };
  },
};

// ---- sync example (simple returns) ----
const userMock = mock(service, "getUser").returns({ id: 42 });

console.log(service.getUser()); // { id: 42 }
console.log(service.getUser()); // { id: 42 }
console.log("Called:", userMock.called()); // 2

userMock.restore();

console.log(service.getUser()); // { id: 1 }

// ---- sync example (withArgs) ----
const userWithArgsMock = mock(service, "getUser")
  .withArgs(1)
  .returns({ id: 1 })
  .withArgs(2)
  .returns({ id: 2 })
  .returns({ id: 0 }); // fallback

console.log(service.getUser(1)); // { id: 1 }
console.log(service.getUser(2)); // { id: 2 }
console.log(service.getUser(999)); // { id: 0 }
console.log("Called:", userWithArgsMock.called()); // 3

userWithArgsMock.restore();

console.log(service.getUser(5)); // { id: 5 }

// ---- async example (withArgs + resolves) ----
const asyncMock = mock(service, "fetchUser")
  .withArgs(1)
  .resolves({ id: 100 })
  .withArgs(2)
  .resolves({ id: 200 })
  .resolves({ id: -1 }); // fallback

service.fetchUser(1).then((user) => {
  console.log(user); // { id: 100 }
});

service.fetchUser(2).then((user) => {
  console.log(user); // { id: 200 }
});

service.fetchUser(999).then((user) => {
  console.log(user); // { id: -1 }
  console.log("Called:", asyncMock.called()); // 3

  asyncMock.restore();
});

// =======================================================
// =============== ADDITIONAL EXAMPLES ===================
// =======================================================

// ---- once(): first call behaves differently ----
const onceMock = mock(service, "getUser")
  .once()
  .returns({ id: 999 })
  .returns({ id: 1 });

console.log(service.getUser()); // { id: 999 }
console.log(service.getUser()); // { id: 1 }
console.log(service.getUser()); // { id: 1 }

onceMock.restore();

// ---- times(): temporary behavior for N calls ----
const timesMock = mock(service, "getUser")
  .times(2)
  .returns({ id: -1 })
  .returns({ id: 1 });

console.log(service.getUser()); // { id: -1 }
console.log(service.getUser()); // { id: -1 }
console.log(service.getUser()); // { id: 1 }

timesMock.restore();

// ---- combining once + times ----
const combinedMock = mock(service, "getUser")
  .once()
  .returns({ id: 1000 })
  .times(2)
  .returns({ id: -1 })
  .returns({ id: 1 });

console.log(service.getUser()); // { id: 1000 } (once)
console.log(service.getUser()); // { id: -1 }   (times)
console.log(service.getUser()); // { id: -1 }   (times)
console.log(service.getUser()); // { id: 1 }    (fallback)

combinedMock.restore();

// ---- calledArgs(): inspect how the function was called ----
const argsMock = mock(service, "getUser").returns({ id: 0 });

service.getUser(10);
service.getUser(20);
service.getUser(30);

console.log(argsMock.calledArgs());
// [[10], [20], [30]]

argsMock.restore();

// ---- restoreAll(): restore all mocks at once ----
mock(service, "getUser").returns({ id: 123 });
mock(service, "fetchUser").resolves({ id: 456 });

console.log(service.getUser()); // { id: 123 }

service.fetchUser().then((user) => {
  console.log(user); // { id: 456 }

  // restore everything
  restoreAll();

  console.log(service.getUser()); // { id: 1 }

  service.fetchUser().then((u) => {
    console.log(u); // { id: 1 }
  });

  // =======================================================
  // =============== MORE ADVANCED EXAMPLES ================
  // =======================================================

  // ---- onCall(): behavior based on call order ----
  const onCallMock = mock(service, "getUser")
    .onCall(1)
    .returns({ id: 10 })
    .onCall(3)
    .returns({ id: 30 })
    .returns({ id: 0 }); // fallback

  console.log(service.getUser()); // { id: 10 }  (call #1)
  console.log(service.getUser()); // { id: 0 }   (call #2)
  console.log(service.getUser()); // { id: 30 }  (call #3)
  console.log(service.getUser()); // { id: 0 }   (call #4)

  console.log("Called:", onCallMock.called()); // 4

  onCallMock.restore();

  // ---- onCall(): retry / failure simulation ----
  const retryMock = mock(service, "fetchUser")
    .onCall(1)
    .throws(new Error("temporary failure"))
    .onCall(2)
    .throws(new Error("temporary failure"))
    .resolves({ id: 999 }); // success on next calls

  service.fetchUser().catch((e) => console.log(e.message)); // temporary failure
  service.fetchUser().catch((e) => console.log(e.message)); // temporary failure

  service.fetchUser().then((user) => {
    console.log(user); // { id: 999 }
    retryMock.restore();
  });

  // ---- reset(): clear call history but keep mock active ----
  const resetMock = mock(service, "getUser").returns({ id: 50 });

  console.log(service.getUser()); // { id: 50 }
  console.log(service.getUser()); // { id: 50 }

  console.log(resetMock.called()); // 2
  console.log(resetMock.calledArgs()); // [[], []]

  resetMock.reset();

  console.log(resetMock.called()); // 0
  console.log(resetMock.calledArgs()); // []

  console.log(service.getUser()); // { id: 50 } (still mocked)

  resetMock.restore();

  // ---- reset() + onCall() together ----
  const resetOnCallMock = mock(service, "getUser")
    .onCall(1)
    .returns({ id: 111 })
    .returns({ id: 1 });

  console.log(service.getUser()); // { id: 111 }
  console.log(service.getUser()); // { id: 1 }

  resetOnCallMock.reset();

  console.log(service.getUser()); // { id: 1 }
  console.log(resetOnCallMock.called()); // 1

  resetOnCallMock.restore();
});
