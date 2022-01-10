import { api } from "./server-api";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import fastify from "fastify";
import cors from "fastify-cors";

const app = fastify();

app.register(cors, {
  origin: "*",
});

attachApiToAppWithDefault(api, app);

(async () => {
  try {
    await app.listen(8000);
    console.info("Server listening on port 8000");
  } catch (err) {
    console.error(err);
  }
})();
