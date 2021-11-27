import { useEffect, useState } from "react";
import { render } from "react-dom";
import type { ApiType } from "../server-api";
import axios from "axios";
import { createBifrost } from "bifrost";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

const { query, useQuery } = createBifrost<ApiType>({
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
    query.accounts.someCoolAccountsFn({ foo: "asdf" }).then((data) => {
      console.log("Fetched data!", data.someValue);
    });
  }, []);

  const r = useQuery().accounts.anotherCoolAccountsFn(
    { bar: 123, blah: "asdf" },
    {
      select: (a) => a.waddup,
    }
  );

  return <div>Hello world! {r.data}</div>;
}

render(<App />, document.getElementById("root"));
