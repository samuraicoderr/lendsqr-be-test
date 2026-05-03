import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env";
import { getOpenApiDocument } from "./openapi";

const router = Router();
let cachedDocument: ReturnType<typeof getOpenApiDocument> | null = null;

function getDocument() {
  if (!cachedDocument) {
    cachedDocument = getOpenApiDocument();
  }
  return cachedDocument;
}

router.get("/openapi.json", (req, res) => {
  const document = getDocument();
  const pathCount = Object.keys(document.paths ?? {}).length;
  console.info(`[docs] serving OpenAPI with ${pathCount} paths`);
  res.status(200).json(document);
});

if (env.docs.uiEnabled) {
  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: "/docs/openapi.json",
        persistAuthorization: true
      }
    })
  );
}

export default router;
