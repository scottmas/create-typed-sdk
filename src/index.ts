import safeStringify from "fast-safe-stringify";
import {
  DeepAsyncFnRecord,
  Opts,
  TypedQuery,
  TypedUseInfiniteQuery,
  TypedUseQuery,
} from "./types";
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { createBifrostQuery } from "./server";

export { createBifrostQuery } from "./server";

export function createBifrost<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): {
  query: TypedQuery<Endpoints>;
  useQuery: () => TypedUseQuery<Endpoints>;
  useInfiniteQuery: () => TypedUseInfiniteQuery<Endpoints>;
  // useQuerys: () =>
} {
  return {
    query: createBifrostQuery<Endpoints>(opts),
    useQuery: createBifrostUseQuery<Endpoints>(opts),
    useInfiniteQuery: createBifrostUseInfiniteQuery<Endpoints>(opts),
  };
}

export function createBifrostUseQuery<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseQuery<Endpoints> {
  const getNextUseQuery = (p: { path: string[] }): any => {
    return new Proxy(
      () => {}, //use function as base, so that it can be called...
      {
        apply(__, ___, args) {
          const argument = args[0] as any;

          const extraQueryOpts = (args[1] || {}) as UseQueryOptions;
          const queryKey = [...p.path, safeStringify.stableStringify(argument)];

          const queryOpts: UseQueryOptions = {
            queryKey,
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
          return useQuery(queryOpts);
        },
        get(__, prop) {
          return getNextUseQuery({
            path: p.path.concat(prop.toString()),
          });
        },
      }
    );
  };

  const useQueryRet = () => getNextUseQuery({ path: [] });

  return useQueryRet;
}

export function createBifrostUseInfiniteQuery<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): () => TypedUseInfiniteQuery<Endpoints> {
  const getNextUseQuery = (p: { path: string[] }): any => {
    return new Proxy(
      () => {}, //use function as base, so that it can be called...
      {
        apply(__, ___, args) {
          const argument = args[0] as any;

          const extraQueryOpts = (args[1] || {}) as UseInfiniteQueryOptions;
          const queryKey = [...p.path, safeStringify.stableStringify(argument)];

          const queryOpts: UseInfiniteQueryOptions = {
            queryKey,
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
          return useInfiniteQuery(queryOpts);
        },
        get(__, prop) {
          return getNextUseQuery({
            path: p.path.concat(prop.toString()),
          });
        },
      }
    );
  };

  const useQueryRet = () => getNextUseQuery({ path: [] });

  return useQueryRet;
}
