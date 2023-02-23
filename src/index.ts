import { Context, Hono } from "hono";
import { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const { ALLOWED_TOKENS } = c.env;
  const authToken = c.req.header("authorization")?.split(" ")[1];

  if (!authToken) {
    return c.text("Missing auth token", 401);
  }

  if (!ALLOWED_TOKENS.includes(authToken)) {
    return c.text("Invalid auth token", 401);
  }

  await next();
});

app.get("/v8/artifacts/:id", async (c) => {
  const artifactID = c.req.param("id");
  if (!artifactID) {
    return c.text("Can't lookup an artifact without an id", 400);
  }

  const { ARTIFACTS } = c.env;

  const existingArtifact = await ARTIFACTS.get(artifactID, {
    type: "stream",
  });

  if (!existingArtifact) {
    return c.notFound();
  }

  return c.newResponse(existingArtifact);
});

app.on(["POST", "PUT"], "/v8/artifacts/:id", async (c) => {
  const { ARTIFACTS } = c.env;
  const artifactID = c.req.param("id");

  if (!artifactID) {
    return c.text("Can't store an artifact without an id", 400);
  }

  // Store the ReadableStream as a value :exploding_head:
  await ARTIFACTS.put(artifactID, c.req.body!, {
    expirationTtl: 60 * 60 * 24 * 7, // 1 week
  });

  return c.json({ status: "success", message: "Artifact stored" });
});

app.get("*", (c) => {
  return c.notFound();
});

export default app;
