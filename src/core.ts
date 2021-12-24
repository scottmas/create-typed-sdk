import {
  DeepAsyncFnRecord,
  Opts,
  TypedGetSDKQueryKey,
  TypedSDK,
} from "./types";

import safeStringify from "fast-safe-stringify";

export function createFetcher<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: Opts
): TypedSDK<Endpoints> {
  const getNextQuery = (path: string[]): any => {
    return new Proxy(
      () => {}, //use function as base, so that it can be called...
      {
        apply(__, ___, args) {
          const argument = args[0];
          const prom = opts.doFetch({ argument, path });

          if (opts.queryClient) {
            prom.then((resp) => {
              opts.queryClient?.setQueryData(getQueryKey(path, argument), resp);
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

export function getQueryKey(path: string[], argument: unknown) {
  const queryKey = [...path];
  if (argument !== "undefined") {
    queryKey.push(safeStringify.stableStringify(argument));
  }
  return queryKey;
}
