import { createTypedSDK, QueryClient } from "create-typed-sdk";
import axios from "axios";
import type { ApiType } from "./server-api";

export function createServerSDK(queryClient: QueryClient) {
  const ServerSDK = createTypedSDK<ApiType>({
    queryClient,
    doFetch: async ({ argument, path }) => {
      return axios
        .post(`http://localhost:8000/${path.join("/")}`, { argument })
        .then((resp) => resp.data);
    },
  });

  //Important: You should return a capitalized SDK so that rules of hooks treats the SDK like a namespace.
  return { ServerSDK };
}
