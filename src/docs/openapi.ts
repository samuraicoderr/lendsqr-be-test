import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Demo Credit Wallet Service",
      version: "1.0.0"
    }
  });

  const pathCount = Object.keys(document.paths ?? {}).length;
  console.info(`[docs] generated OpenAPI with ${pathCount} paths`);

  return document;
}
