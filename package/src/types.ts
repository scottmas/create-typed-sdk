import type {
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  QueryClient,
} from "react-query";

export type DoFetch = <TPageParam = any>(
  p: {
    path: readonly string[];
    argument: any;
  } & Partial<QueryFunctionContext<readonly string[], TPageParam>>
) => Promise<any>;

export type Opts =
  | { url: string; queryClient?: QueryClient }
  | {
      queryClient?: QueryClient;
      doFetch: DoFetch;
    };

export type AsyncFn = (...args: any[]) => Promise<any>;

export type DeepAsyncFnRecord<T extends {}> = {
  [key in keyof T]: T[key] extends AsyncFn ? T[key] : DeepAsyncFnRecord<T[key]>;
};

export type TypedSDK<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (argument: Parameters<T[key]>[0]) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedSDK<T[key]>
    : never;
};

export type TypedGetSDKQueryKey<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (argument?: Parameters<T[key]>[0]) => string[]
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? (() => string[]) & TypedGetSDKQueryKey<T[key]>
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
    ? TypedUseInfiniteQuery<T[key]>
    : never;
};

export type TypedUseSDKMutation<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <
        TData = Awaited<ReturnType<T[key]>>,
        TError = unknown,
        TVariables = Parameters<T[key]>[0],
        TContext = unknown
      >(
        options?: UseMutationOptions<TData, TError, TVariables, TContext>
      ) => UseMutationResult<TData, TError, TVariables, TContext>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseSDKMutation<T[key]>
    : never;
};

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
