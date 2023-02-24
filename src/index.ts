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

app.post("/v8/artifacts/events", async (c) => {
  const { DURATION } = c.env;
  const body = await c.req.json();
  const currentTotal = (await DURATION.get("TIME_SAVED")) ?? 0;

  let runningTotal = 0;

  for await (const entry of body) {
    const { hash, event } = entry;

    if (event === "HIT") {
      const timeSaved = await DURATION.get(hash);

      if (timeSaved) {
        runningTotal += Number(timeSaved);
      }
    }
  }

  await DURATION.put(
    "TIME_SAVED",
    (Number(currentTotal) + runningTotal).toString()
  );
  return c.json({ status: "success", message: "Event received" });
});

app.on(["POST", "PUT"], "/v8/artifacts/:id", async (c) => {
  const { ARTIFACTS, DURATION } = c.env;
  const artifactID = c.req.param("id");
  const duration = c.req.header("x-artifact-duration");

  if (!artifactID) {
    return c.text("Can't store an artifact without an id", 400);
  }

  // Store the ReadableStream as a value :exploding_head:
  await ARTIFACTS.put(artifactID, c.req.body!, {
    expirationTtl: 60 * 60 * 24 * 7, // 1 week
  });

  if (duration) {
    await DURATION.put(artifactID, duration);
  }

  return c.json({ status: "success", message: "Artifact stored" });
});

app.get("/time_saved", async (c) => {
  const timeSaved = await c.env.DURATION.get("TIME_SAVED");
  if (!timeSaved) return c.json({});

  return c.json({
    milliseconds: Number(timeSaved),
    seconds: Number(timeSaved) / 1000,
    minutes: Number(timeSaved) / 1000 / 60,
  });
});

export default app;
