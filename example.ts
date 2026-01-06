import { mock } from "./src";

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
  .withArgs(1).returns({ id: 1 })
  .withArgs(2).returns({ id: 2 })
  .returns({ id: 0 }); // fallback

console.log(service.getUser(1)); // { id: 1 }
console.log(service.getUser(2)); // { id: 2 }
console.log(service.getUser(999)); // { id: 0 }
console.log("Called:", userWithArgsMock.called()); // 3

userWithArgsMock.restore();

console.log(service.getUser(5)); // { id: 5 }

// ---- async example (withArgs + resolves) ----
const asyncMock = mock(service, "fetchUser")
  .withArgs(1).resolves({ id: 100 })
  .withArgs(2).resolves({ id: 200 })
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
