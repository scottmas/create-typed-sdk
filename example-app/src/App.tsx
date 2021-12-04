import { useEffect } from "react";
import { render } from "react-dom";
import { createServerSDK } from "../server-sdk";
import { QueryClient, QueryClientProvider, useQueryClient } from "react-query";

const queryClient = new QueryClient();

const { ServerSDK } = createServerSDK(queryClient);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  useEffect(() => {
    ServerSDK.sdk.accounts.someCoolAccountsFn({ foo: "asdf" }).then((data) => {
      console.log("Fetched data!", data.someValue);
    });
  }, []);

  const r2 = ServerSDK.useSDKMutation().accounts.someCoolAccountsFn();

  const qc = useQueryClient();

  const r = ServerSDK.useSDK().accounts.anotherCoolAccountsFn(
    { bar: 123, blah: "asdf" },
    {
      select: (a) => a.waddup,
    }
  );

  return (
    <div
      onClick={() => {
        const asdf = ServerSDK.getSDKQueryKey.accounts.anotherCoolAccountsFn({
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
