export const api = {
  accounts: {
    async someCoolAccountsFn(someParam: { foo: string }) {
      return { someValue: true };
    },
    async anotherCoolAccountsFn(someObjParam: { blah: string; bar: number }) {
      return { waddup: "dawg" as const };
    },
  },

  posts: {
    async someCoolPostsFn() {
      console.info("Some super secret something....");
    },
    async anotherCoolPostsFn() {
      console.info("Another super secret something....");
    },
  },
};

export type ApiType = typeof api;
