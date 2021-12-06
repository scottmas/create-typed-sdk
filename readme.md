# Created Typed SDK

A library for quickly created SDKs for your Node.js Typescript backends. No build step, no risk of injecting your server code into your frontend, just sweet, sweet DX goodness.

## Installation & Usage

### Server

Define a server file like so:

```typescript
// server.ts

// 1. Define your backend as an arbitrarily deep object of async functions

//Note: This object can have ANY structure. The only requirements are (a) that the object leaf nodes are promise returning functions and (b) those functions only accept a SINGLE parameter.

//In this example we namespace by POST and GET properties on the API but this is simply a convention
const myApi = {
  accounts: {
    GET: {
      async getById(p: { id: string }) {
        const user = await Promise.resolve({ name: "John Doe" }) //TODO: actually fetch data...
        return user;
      },
    },
    POST: {
      updateById(p: { userId: string; newName: string }) {
        return Promise.resolve({success: true})
      },
    }
  },
  articles: {
    GET: {
      getById(: { id: string }) {
        return Promise.resolve({ title: "Some Article" });
      },
    },
    POST: {
      updateById(p: { articleId: string; newName: string }) {
        return Promise.resolve({success: true})
      },
    }
  },
};

export type MyApiType = typeof myApi

// 2. Hook up your API to an actual server that listens for requests, such as fastify or express
import { collectEndpoints } from "create-typed-sdk/server";
import fastify from "fastify";
import cors from "fastify-cors";
const app = fastify();

app.register(cors, { origin: "*"});

collectEndpoints(myApi).forEach(({ fn, path }) => {
  const method = path[path.length - 2].toLowerCase();

  app[method](
    "/" + path.join("/"),
    async (req, resp) => {
      const data = method === 'get' ? req.query : req.body
      const val = await fn(data);
      resp.send(val);
    }
  );
});

(async () => {
  try {
    await app.listen(8000);
    console.info("Server listening on port 8000");
  } catch (err) {
    console.error(err);
  }
})();
```

### Frontend

```TSX
// 3. Define your rules and transport for translating a path (like `accounts.GET.getById`) into an actual request
// Note that the assumptions of your backend must be adhered to here...
import axios from 'axios';
function doFetch({ path, argument }) {

  const method = path[1]
  const data = method === 'GET' ? {params: argument} : {body: argument}
  return axios(`http://my-api-server.com/${path.join("/")}`, {
    method,
    body: method !== 'GET' ? argument : undefined,
    params: method === "GET'
  }).then((resp) => {
    if (!resp.ok) {
      throw new Error(resp.statusText);
    }

    return resp.json();
  });
}

// 4. Import your Types and create the SDK
import type { MyApiType } from './my-server' //IMPORTANT NOTE: Only import the api TYPE, not the api itself so as not to expose server details to your client
import { createTypedSDK } from "create-typed-sdk";
import { QueryClient } from "react-query";

const queryClient = new QueryClient();

const MyServerSDK = createTypedSDK<ApiType>({
  queryClient, //Optional react-query dependency for easy data fetching in React land
  doFetch,
});

// 5. Use it!
function App(){

  // Note: It is recommended that your SDK be an uppercase variable like `MyServerSDK` (e.g a namespace) so that the hook usage below will be linted per the rules of hooks
  const resp = MyServerSDK.useEndpoint().accounts.GET.getById({id: "some-user})

  return <div>Hello, my name is {resp.data.name}</div>

}
```
