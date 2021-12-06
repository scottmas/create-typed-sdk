import safeStringify from "fast-safe-stringify";
import {
  DeepAsyncFnRecord,
  TypedGetSDKQueryKey,
  Opts,
  TypedSDK as TypedSDK,
  TypedUseInfiniteQuery as TypedUseInfiniteSDK,
  TypedUseQuery as TypedUseSDK,
  TypedUseSDKMutation,
} from "./types";
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { createFetcher } from "./server";

//For convenience, export the react-query QueryClient type
export type { QueryClient } from "react-query";

export function createTypedSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): {
  fetch: TypedSDK<Endpoints>;
  prefetch: TypedSDK<Endpoints>;
  getQueryKey: TypedGetSDKQueryKey<Endpoints>;
  useEndpoint: () => TypedUseSDK<Endpoints>;
  useInfiniteEndpoint: () => TypedUseInfiniteSDK<Endpoints>;
  useMutationEndpoint: () => TypedUseSDKMutation<Endpoints>;
} {
  return {
    fetch: createFetcher<Endpoints>(opts),
    prefetch: createPrefetcher<Endpoints>(opts),
    getQueryKey: createGetQueryKey<Endpoints>(opts),
    useEndpoint: createUseEndpoint<Endpoints>(opts),
    useInfiniteEndpoint: createUseInfiniteEndpoint<Endpoints>(opts),
    useMutationEndpoint: createUseMutationEndpoint<Endpoints>(opts),
  };
}

function createUseEndpoint<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): () => TypedUseSDK<Endpoints> {
  const getNextUseEndpoint = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
        if (!opts.queryClient) {
          console.error("No query client provided. Unable to call useSDK");
          return Promise.resolve();
        }

        const argument = args[0] as any;

        const extraQueryOpts = (args[1] || {}) as UseQueryOptions;

        const queryOpts: UseQueryOptions = {
          queryKey: getQueryKey(p.path, argument),
          queryFn: ({ signal, queryKey, meta, pageParam }) =>
            opts.doFetch({
              argument,
              path: p.path,
              signal,
              queryKey: queryKey as any,
              meta,
              pageParam,
            }),
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

  const useQueryRet = () => getNextUseEndpoint({ path: [] });

  return useQueryRet;
}

function createUseInfiniteEndpoint<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseInfiniteSDK<Endpoints> {
  const getNextUseInfiniteEndpoint = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
        if (!opts.queryClient) {
          console.error(
            "No query client provided. Unable to call useInfiniteSDK"
          );
          return Promise.resolve();
        }

        const argument = args[0] as any;

        const extraQueryOpts = (args[1] || {}) as UseInfiniteQueryOptions;

        const queryOpts: UseInfiniteQueryOptions = {
          queryKey: getQueryKey(p.path, argument),
          queryFn: ({ signal, queryKey, meta, pageParam }) =>
            opts.doFetch({
              argument,
              path: p.path,
              signal,
              queryKey: queryKey as any,
              meta,
              pageParam,
            }),
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

  const useQueryRet = () => getNextUseInfiniteEndpoint({ path: [] });

  return useQueryRet;
}

function createUseMutationEndpoint<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseSDKMutation<Endpoints> {
  const getNextUseMutation = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
        if (!opts.queryClient) {
          console.error("No query client provided. Unable to use mutation");
          return Promise.resolve();
        }

        const argument = args[0] as any;

        const extraQueryOpts = (args[1] || {}) as UseMutationOptions;
        const mutationKey = getQueryKey(p.path, argument);

        const queryOpts: UseMutationOptions = {
          mutationKey,
          mutationFn: () =>
            opts.doFetch({
              argument,
              path: p.path,
              queryKey: mutationKey as any,
            }),
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

  const useMutationRet = () => getNextUseMutation({ path: [] });

  return useMutationRet;
}

function createPrefetcher<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): TypedSDK<Endpoints> {
  const getNextSDK = (path: string[]): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
        if (!opts.queryClient) {
          console.error("No query client provided. Unable to prefetch");
          return Promise.resolve();
        }
        const argument = args[0];
        const prom = opts.doFetch({ argument, path });
        prom.then((resp) => {
          opts.queryClient?.setQueryData(getQueryKey(path, argument), resp);
        });

        return prom;
      },
      get(__, prop) {
        return getNextSDK(path.concat(prop.toString()));
      },
    });
  };

  return getNextSDK([]);
}

function createGetQueryKey<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): TypedGetSDKQueryKey<Endpoints> {
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
}

function getQueryKey(path: string[], argument: unknown) {
  const queryKey = [...path];
  if (argument !== "undefined") {
    queryKey.push(safeStringify.stableStringify(argument));
  }
  return queryKey;
}
