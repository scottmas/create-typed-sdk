import safeStringify from "fast-safe-stringify";

import {
  DeepAsyncFnRecord,
  TypedGetSDKQueryKey,
  Opts,
  TypedSDK as TypedSDK,
  TypedUseInfiniteQuery as TypedUseInfiniteSDK,
  TypedUseQuery as TypedUseSDK,
  TypedUseSDKMutation,
  DoFetch,
} from "./types";
import type {
  QueryClient,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  default as rqDefault,
} from "react-query";
import axios from "axios";

//For convenience, export the react-query QueryClient type
export type { QueryClient } from "react-query";

let reactQuery: typeof rqDefault;
export async function createTypedSDK<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): Promise<SDK<Endpoints>> {
  if (opts.queryClient) {
    reactQuery = await import("react-query");
  }

  return new SDK(opts);
}

class SDK<Endpoints extends DeepAsyncFnRecord<Endpoints>> {
  private defaultUrl?: string;
  private queryClient?: QueryClient;
  private userSuppliedDoFetch?: DoFetch;

  constructor(opts: Opts) {
    if ("doFetch" in opts) {
      this.userSuppliedDoFetch = opts.doFetch;
    }

    if ("url" in opts) {
      this.defaultUrl = opts.url;
    }

    this.queryClient = opts.queryClient;
  }

  private doFetch: DoFetch = (p) => {
    if (this.userSuppliedDoFetch) {
      return this.userSuppliedDoFetch(p);
    } else {
      if (!this.defaultUrl) {
        throw new Error(
          "url must be supplied to SDK constructor if no doFetch function is provided"
        );
      }

      return axios
        .post(`${this.defaultUrl}/${p.path.join("/")}`, {
          argument: p.argument,
        })
        .then((resp) => resp.data);
    }
  };

  fetch: TypedSDK<Endpoints> = (() => {
    const getNextQuery = (path: string[]): any => {
      return new Proxy(
        () => {}, //use function as base, so that it can be called...
        {
          apply: (__, ___, args) => {
            const argument = args[0];

            const prom = this.doFetch({ argument, path });

            if (this.queryClient) {
              prom.then((resp: any) => {
                this.queryClient?.setQueryData(
                  getQueryKey(path, argument),
                  resp
                );
              });
            }

            return prom;
          },
          get(__, prop) {
            return getNextQuery(path.concat(prop.toString()));
          },
        }
      );
    };

    return getNextQuery([]);
  })();

  getQueryKey: TypedGetSDKQueryKey<Endpoints> = (() => {
    const getNextGetSDKQueryKey = (path: string[]): any => {
      return new Proxy(() => {}, {
        apply(__, ___, args) {
          return getQueryKey(path, args[0]);
        },
        get(__, prop) {
          return getNextGetSDKQueryKey(path.concat(prop.toString()));
        },
      });
    };

    return getNextGetSDKQueryKey([]);
  })();

  private useEndpointProxy = (() => {
    const getNextUseEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          if (!this.queryClient) {
            console.error("No query client provided. Unable to call useSDK");
            return Promise.resolve();
          }

          const argument = args[0] as any;

          const extraQueryOpts = (args[1] || {}) as UseQueryOptions;

          const queryOpts: UseQueryOptions = {
            queryKey: getQueryKey(p.path, argument),
            queryFn: ({ signal, queryKey, meta, pageParam }) => {
              return this.doFetch({
                argument,
                path: p.path,
                signal,
                queryKey: queryKey as any,
                meta,
                pageParam,
              });
            },
            ...extraQueryOpts,
          };

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return reactQuery.useQuery(queryOpts);
        },
        get(__, prop) {
          return getNextUseEndpoint({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseEndpoint({ path: [] });
  })();

  useEndpoint(): TypedUseSDK<Endpoints> {
    return this.useEndpointProxy;
  }

  private useInfiniteEndpointProxy = (() => {
    const getNextUseInfiniteEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          if (!this.queryClient) {
            console.error(
              "No query client provided. Unable to call useInfiniteSDK"
            );
            return Promise.resolve();
          }

          const argument = args[0] as any;

          const extraQueryOpts = (args[1] || {}) as UseInfiniteQueryOptions;

          const queryOpts: UseInfiniteQueryOptions = {
            queryKey: getQueryKey(p.path, argument),
            queryFn: ({ signal, queryKey, meta, pageParam }) => {
              this.doFetch({
                argument,
                path: p.path,
                signal,
                queryKey: queryKey as any,
                meta,
                pageParam,
              });
            },
            ...extraQueryOpts,
          };

          const useInfiniteQuery = reactQuery.useInfiniteQuery;

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useInfiniteQuery(queryOpts);
        },
        get(__, prop) {
          return getNextUseInfiniteEndpoint({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseInfiniteEndpoint({ path: [] });
  })();

  useInfiniteEndpoint(): TypedUseInfiniteSDK<Endpoints> {
    return this.useInfiniteEndpointProxy;
  }

  private useMutationEndpointProxy = (() => {
    const getNextUseMutation = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          if (!this.queryClient) {
            console.error("No query client provided. Unable to use mutation");
            return Promise.resolve();
          }

          const argument = args[0] as any;

          const extraQueryOpts = (args[1] || {}) as UseMutationOptions;
          const mutationKey = getQueryKey(p.path, argument);

          const queryOpts: UseMutationOptions = {
            mutationKey,
            mutationFn: () => {
              return this.doFetch({
                argument,
                path: p.path,
                queryKey: mutationKey as any,
              });
            },
            ...extraQueryOpts,
          };

          const useMutation = reactQuery.useMutation;

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useMutation(queryOpts);
        },
        get(__, prop) {
          return getNextUseMutation({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseMutation({ path: [] });
  })();

  useMutationEndpoint(): TypedUseSDKMutation<Endpoints> {
    return this.useMutationEndpointProxy;
  }
}

export function attachApiToAppWithDefault<T extends DeepAsyncFnRecord<T>>(
  api: T,
  app: {
    post: (
      path: string,
      handler: (
        req: { body: any },
        resp: { send: (v: any) => any } | { json: (v: any) => any }
      ) => void
    ) => any;
  }
) {
  collectEndpoints(api).forEach(({ fn, path }) => {
    if (!app.post) {
      throw new Error(
        "No post method found on app! Ensure you are using a nodejs library like express or fastify"
      );
    }

    app.post("/" + path.join("/"), async (req, resp) => {
      if (!req.body) {
        throw new Error(
          "Unable to find post body! Ensure your server parses the request body and attaches it to the request"
        );
      }

      const val = await fn(req.body.argument);
      if ("send" in resp) {
        resp.send(val);
      } else if ("json" in resp) {
        resp.json(val);
      } else {
        throw new Error(
          "Unable to find method to send response! Ensure you are using a nodejs library like express or fastify"
        );
      }
    });
  });
}

export function collectEndpoints<T extends DeepAsyncFnRecord<T>>(api: T) {
  function collectLeafFunctions(value: any, path = [] as string[]) {
    const fns = [];
    if (isPlainObject(value) || Array.isArray(value)) {
      Object.keys(value).forEach((key) => {
        fns.push(...collectLeafFunctions(value[key], path.concat(key)));
      });
    } else {
      if (typeof value === "function") {
        fns.push({
          path,
          fn: value,
        });
      }
    }
    return fns;
  }
  return collectLeafFunctions(api);
}

function isPlainObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null && value !== Object.prototype) {
    return true;
  }
  if (proto && Object.getPrototypeOf(proto) === null) {
    return true;
  }
  return false;
}

function getQueryKey(path: string[], argument: unknown) {
  const queryKey = [...path];
  if (argument !== "undefined") {
    queryKey.push(safeStringify.stableStringify(argument));
  }
  return queryKey;
}
