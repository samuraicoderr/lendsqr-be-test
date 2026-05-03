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
  res.status(200).json(getDocument());
});

if (env.docs.uiEnabled) {
  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(getDocument(), {
      swaggerOptions: {
        persistAuthorization: true
      }
    })
  );
}

export default router;
