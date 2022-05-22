import { Request as IttyRequest } from "itty-router";
import {
  error,
  json,
  missing,
  StatusError,
  ThrowableRouter,
} from "itty-router-extras";

const router = ThrowableRouter();

type FullRequest = Request & IttyRequest;

const checkToken = (request: FullRequest, env: Bindings) => {
  const authToken = request.headers.get("authorization")?.split(" ")[1];

  if (!authToken) {
    throw new StatusError(401, "Missing auth token");
  }

  if (!env.ALLOWED_TOKENS.includes(authToken)) {
    throw new StatusError(401, "Invalid auth token");
  }
};

router.get("/v8/artifacts/:id", async (request: FullRequest, env: Bindings) => {
  checkToken(request, env);

  if (!request.params?.id)
    return error(400, `Can't lookup an artifact without an id`);

  const existingArtifact = await env.ARTIFACTS.get(request.params.id, {
    type: "stream",
  });

  if (!existingArtifact) {
    return missing("Cache miss");
  }

  return new Response(existingArtifact);
});

async function saveArtifact(request: FullRequest, env: Bindings) {
  checkToken(request, env);

  const { ARTIFACTS } = env;
  if (!request.params?.id)
    return error(400, `Can't store an artifact without an id`);

  // Store the ReadableStream as a value :exploding_head:
  await ARTIFACTS.put(request.params.id, request.body!);

  return json({ status: "success", message: "Artifact stored" });
}

router.post("/v8/artifacts/:id", saveArtifact);
router.put("/v8/artifacts/:id", saveArtifact);

router.all("*", () => missing("Not found"));

export const handleRequest = router.handle;

export default { fetch: handleRequest };
