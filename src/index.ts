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
import { createBifrostSDK } from "./server";

//For convenience, export the react-query QueryClient type
export type { QueryClient } from "react-query";

export function createBifrost<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): {
  sdk: TypedSDK<Endpoints>;
  sdkPrefetch: TypedSDK<Endpoints>;
  getSDKQueryKey: TypedGetSDKQueryKey<Endpoints>;
  useSDK: () => TypedUseSDK<Endpoints>;
  useInfiniteSDK: () => TypedUseInfiniteSDK<Endpoints>;
  useSDKMutation: () => TypedUseSDKMutation<Endpoints>;
} {
  return {
    sdk: createBifrostSDK<Endpoints>(opts),
    sdkPrefetch: createBifrostSDKPrefetch<Endpoints>(opts),
    getSDKQueryKey: createGetSDKQueryKey<Endpoints>(opts),
    useSDK: createBifrostUseSDK<Endpoints>(opts),
    useInfiniteSDK: createBifrostUseInfiniteSDK<Endpoints>(opts),
    useSDKMutation: createBifrostUseSDKMutation<Endpoints>(opts),
  };
}

export function createBifrostUseSDK<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseSDK<Endpoints> {
  const getNextUseSDK = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
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
        return getNextUseSDK({
          path: p.path.concat(prop.toString()),
        });
      },
    });
  };

  const useQueryRet = () => getNextUseSDK({ path: [] });

  return useQueryRet;
}

export function createBifrostUseInfiniteSDK<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseInfiniteSDK<Endpoints> {
  const getNextUseInfiniteSDK = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
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
        return getNextUseInfiniteSDK({
          path: p.path.concat(prop.toString()),
        });
      },
    });
  };

  const useQueryRet = () => getNextUseInfiniteSDK({ path: [] });

  return useQueryRet;
}

export function createBifrostUseSDKMutation<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseSDKMutation<Endpoints> {
  const getNextUseMutation = (p: { path: string[] }): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
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

export function createBifrostSDKPrefetch<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): TypedSDK<Endpoints> {
  const getNextSDK = (path: string[]): any => {
    return new Proxy(() => {}, {
      apply(__, ___, args) {
        const argument = args[0];
        const prom = opts.doFetch({ argument, path });
        prom.then((resp) => {
          opts.queryClient.setQueryData(getQueryKey(path, argument), resp);
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

export function createGetSDKQueryKey<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): TypedGetSDKQueryKey<Endpoints> {
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
