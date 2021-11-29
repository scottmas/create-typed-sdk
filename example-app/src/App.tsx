import { useEffect, useState } from "react";
import { render } from "react-dom";
import type { ApiType } from "../server-api";
import axios from "axios";
import { createBifrost } from "bifrost";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "react-query";

const queryClient = new QueryClient();

const Bifrost = createBifrost<ApiType>({
  queryClient,
  doFetch: async ({ argument, path }) => {
    return axios
      .post(`http://localhost:8000/${path.join("/")}`, { argument })
      .then((resp) => resp.data);
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  useEffect(() => {
    Bifrost.sdk.accounts.someCoolAccountsFn({ foo: "asdf" }).then((data) => {
      console.log("Fetched data!", data.someValue);
    });
  }, []);

  const r2 = Bifrost.useSDKMutation().accounts.someCoolAccountsFn();

  const qc = useQueryClient();

  const r = Bifrost.useSDK().accounts.anotherCoolAccountsFn(
    { bar: 123, blah: "asdf" },
    {
      select: (a) => a.waddup,
    }
  );

  return (
    <div
      onClick={() => {
        const asdf = Bifrost.getSDKQueryKey.accounts.anotherCoolAccountsFn({
          blah: "asdf",
          bar: 123,
        });
        qc.invalidateQueries();
      }}
    >
      Hello world! {r.data}
    </div>
  );
}

render(<App />, document.getElementById("root"));
