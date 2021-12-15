# Created Typed SDK

A library for quickly created SDKs for your Node.js Typescript backends. No build step, no risk of injecting your server code into your frontend, just sweet, sweet DX goodness.

## Installation & Usage

Add the the package as a dependency

```bash
npm install create-typed-sdk
```

Then perform the following steps

### 1. Define your backend logic as an arbitrarily deep object of async functions

Note: This object can have ANY structure. The only requirements are (a) that the object leaf nodes are promise returning functions and (b) those functions only accept a SINGLE parameter.

In this example we namespace by POST and GET properties on the API but this is simply a convention

```typescript
// api.ts

export const myApi = {
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
```

### 2. Hook up deep API object to listen for requests, such as with fastify or express

Note: Make sure you adhere to the conventions of the deep API object you defined.

```typescript
// server.ts

import { myApi } from "./api.ts";
import { collectEndpoints } from "create-typed-sdk/server";
import fastify from "fastify";
import cors from "fastify-cors";
const app = fastify();

app.register(cors, { origin: "*" });

collectEndpoints(myApi).forEach(({ fn, path }) => {
  const method = path[path.length - 2].toLowerCase();

  app[method]("/" + path.join("/"), async (req, resp) => {
    const data = method === "get" ? req.query : req.body;
    const val = await fn(data);
    resp.send(val);
  });
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

### 3. Automagically create an SDK for consumers of your backend

Note: When creating the SDK, you must define the rules and transport that will allow a simple object path (like `accounts.GET.getById`) and an argument to be translated an actual request.

```typescript
// sdk.tsx

//Note: This file is typically going to be the 'main' file of your backend's package.json. This file is what external consumers of your API will be importing.
import axios from 'axios';
import type { MyApiType } from './api' //IMPORTANT NOTE: Only import the api TYPE, not the api itself so as not to expose server details to your client
import { createTypedSDK } from "create-typed-sdk";
import { QueryClient } from "react-query";

const queryClient = new QueryClient();

const MyServerSDK = createTypedSDK<ApiType>({
  queryClient, //Add an optional react-query dependency for easy data fetching in React land
  doFetch({ path, argument }) {
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
},
});
```

### 4. Consume the SDK in your frontend

Import the backend SDK without any risk of leaking backend code

```TSX
// App.tsx

import { MyServerSDK }  from './sdk'

function App(){
  // Note: It is recommended that your SDK be an uppercase variable like `MyServerSDK` (e.g a namespace) so that the hook usage below will be linted per the rules of hooks
  const resp = MyServerSDK.useEndpoint().accounts.GET.getById({id: "some-user})

  return <div>Hello, my name is {resp.data.name}</div>
}
```
