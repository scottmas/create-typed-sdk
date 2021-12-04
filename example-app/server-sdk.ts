import { createBifrost, QueryClient } from "bifrost";
import axios from "axios";
import type { ApiType } from "./server-api";

export function createServerSDK(queryClient: QueryClient) {
  const ServerSDK = createBifrost<ApiType>({
    queryClient,
    doFetch: async ({ argument, path }) => {
      return axios
        .post(`http://localhost:8000/${path.join("/")}`, { argument })
        .then((resp) => resp.data);
    },
  });

  return { ServerSDK };
}
