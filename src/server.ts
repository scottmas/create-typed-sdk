import { DeepAsyncFnRecord, Opts, TypedQuery } from "./types";

export function createBifrostQuery<
  Endpoints extends DeepAsyncFnRecord<Endpoints>
>(opts: Opts): TypedQuery<Endpoints> {
  const getNextQuery = (path: string[]): any => {
    return new Proxy(
      () => {}, //use function as base, so that it can be called...
      {
        apply(__, ___, args) {
          return opts.doFetch({ argument: args[0] || {}, path });
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
