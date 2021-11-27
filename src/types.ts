import type {
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

export type CreateTypedFauxSDKType<T extends DeepAsyncFnRecord<T>> = (
  opts: Opts
) => {
  SDK: TypedQuery<T>;
  useSDK: () => void;
};

export type Opts = {
  doFetch<TPageParam = any>(
    p: {
      path: readonly string[];
      argument: any;
    } & QueryFunctionContext<readonly string[], TPageParam>
  ): Promise<any>;
};

export type AsyncFn = (...args: any[]) => Promise<any>;

export type DeepAsyncFnRecord<T extends {}> = {
  [key in keyof T]: T[key] extends AsyncFn ? T[key] : DeepAsyncFnRecord<T[key]>;
};

export type TypedQuery<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (...args: Parameters<T[key]>) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedQuery<T[key]>
    : never;
};

export type TypedUseQuery<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <
        TQueryFnData = Awaited<ReturnType<T[key]>>,
        TError = unknown,
        TData = TQueryFnData,
        TQueryKey extends QueryKey = QueryKey
      >(
        argument: Parameters<T[key]>[0],
        options?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
      ) => UseQueryResult<TData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseQuery<T[key]>
    : never;
};

export type TypedUseInfiniteQuery<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <
        TQueryFnData = Awaited<ReturnType<T[key]>>,
        TError = unknown,
        TData = TQueryFnData,
        TQueryKey extends QueryKey = QueryKey
      >(
        argument: Parameters<T[key]>[0],
        options?: UseInfiniteQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey
        >
      ) => UseInfiniteQueryResult<TData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseQuery<T[key]>
    : never;
};
