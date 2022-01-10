import { createTypedSDK, QueryClient } from "create-typed-sdk";
import axios from "axios";
import type { ApiType } from "./server-api";

export function createServerSDK(queryClient: QueryClient) {
  return createTypedSDK<ApiType>({
    queryClient,
    doFetch: async ({ argument, path }) => {
      return axios
        .post(`http://localhost:8000/${path.join("/")}`, { argument })
        .then((resp) => resp.data);
    },
  });
}
