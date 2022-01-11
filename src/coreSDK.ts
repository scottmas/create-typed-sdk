import type { QueryClient } from "react-query";
import {
  DeepAsyncFnRecord,
  DoFetch,
  getTypedSDKInstance,
  TypedSDK,
  getFetchFn,
} from "./internal";

export function createTypedSDK<T extends DeepAsyncFnRecord<any>>(
  opts:
    | { url: string; queryClient?: QueryClient }
    | {
        queryClient?: QueryClient;
        doFetch: DoFetch;
      }
): TypedSDK<T> {
  let doFetch: DoFetch;
  if ("doFetch" in opts) {
    doFetch = getFetchFn({ userSuppliedDoFetch: opts.doFetch });
  } else {
    doFetch = getFetchFn({ defaultUrl: opts.url });
  }

  return getTypedSDKInstance({
    doFetch,
    queryClient: opts.queryClient,
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
