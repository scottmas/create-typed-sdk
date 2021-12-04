import { api } from "./server-api";
import { collectEndpoints } from "create-typed-sdk/server";
import fastify from "fastify";
import cors from "fastify-cors";

const app = fastify();

app.register(cors, {
  origin: "*",
});

collectEndpoints(api).forEach(({ fn, path }) => {
  app.post<{ Body: { argument: any } }>(
    "/" + path.join("/"),
    async (req, resp) => {
      const val = await fn(req.body.argument);
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
