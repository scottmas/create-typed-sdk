import {
  DeepAsyncFnRecord,
  TypedGetSDKQueryKey,
  TypedSDK as TypedSDK,
  TypedUseInfiniteQuery as TypedUseInfiniteSDK,
  TypedUseQuery as TypedUseSDK,
  TypedUseSDKMutation,
  DoFetch,
  getQueryKey,
  getFetchFn,
  getTypedSDKInstance,
} from "./internal";
import {
  QueryClient,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "react-query";

export * from "./coreSDK";

//Re-export the query client type when the user is creating the sdk for consumption
export { QueryClient } from "react-query";

export function createTypedReactSDK<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(
  opts:
    | { url: string; queryClient: QueryClient }
    | {
        queryClient: QueryClient;
        doFetch: DoFetch;
      }
): ReactSDK<Endpoints> {
  return new ReactSDK(opts);
}

export class ReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>> {
  private queryClient?: QueryClient;
  private doFetch: DoFetch;

  constructor(
    opts:
      | { url: string; queryClient: QueryClient }
      | {
          queryClient: QueryClient;
          doFetch: DoFetch;
        }
  ) {
    this.queryClient = opts.queryClient;
    if ("doFetch" in opts) {
      this.doFetch = getFetchFn({ userSuppliedDoFetch: opts.doFetch });
    } else {
      this.doFetch = getFetchFn({ defaultUrl: opts.url });
    }

    this.fetch = getTypedSDKInstance({
      queryClient: opts.queryClient,
      doFetch: this.doFetch,
    });
  }

  fetch: TypedSDK<Endpoints>;

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
          return useQuery(queryOpts);
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
