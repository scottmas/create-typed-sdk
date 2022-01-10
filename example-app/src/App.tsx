import { useEffect, useState } from "react";
import { render } from "react-dom";
import { createServerSDK } from "../server-sdk";
import { QueryClient, QueryClientProvider, useQueryClient } from "react-query";

const queryClient = new QueryClient();

const sdkProm = createServerSDK(queryClient);
let ServerSDK: Awaited<typeof sdkProm>;
function App() {
  const [hasBootstraped, setHasBootstraped] = useState(false);
  useEffect(() => {
    sdkProm.then((sdk) => {
      ServerSDK = sdk;
      setHasBootstraped(true);
    });
  }, []);

  if (!hasBootstraped) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  useEffect(() => {
    ServerSDK.fetch.accounts
      .someCoolAccountsFn({ foo: "asdf" })
      .then((data) => {
        console.log("Fetched data!", data.someValue);
      });
  }, []);

  const r2 = ServerSDK.useMutationEndpoint().accounts.someCoolAccountsFn();

  const qc = useQueryClient();

  const r = ServerSDK.useEndpoint().accounts.anotherCoolAccountsFn(
    { bar: 123, blah: "asdf" },
    {
      select: (a) => a.waddup,
    }
  );

  return (
    <div
      onClick={() => {
        const asdf = ServerSDK.getQueryKey.accounts.anotherCoolAccountsFn({
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
