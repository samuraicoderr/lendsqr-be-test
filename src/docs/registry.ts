import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z, ZodTypeAny } from "zod";
import { errorResponseSchema } from "../validation/response.schema";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "Token"
});

const defaultErrorStatuses = [400, 401, 403, 404, 409, 503];

type RouteRequest = {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
};

type RouteResponse = {
  description: string;
  schema?: ZodTypeAny;
};

type RouteConfig = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary: string;
  tags?: string[];
  request?: RouteRequest;
  responses: Record<number, RouteResponse>;
  secured?: boolean;
};

function buildResponse({ description, schema }: RouteResponse) {
  if (!schema) {
    return { description };
  }
  return {
    description,
    content: {
      "application/json": {
        schema
      }
    }
  };
}

export function registerRoute(config: RouteConfig) {
  const responses: Record<number, RouteResponse> = { ...config.responses };

  for (const status of defaultErrorStatuses) {
    if (!responses[status]) {
      responses[status] = {
        description: "Error",
        schema: errorResponseSchema
      };
    }
  }

  const responseDocs = Object.entries(responses).reduce<Record<number, ReturnType<typeof buildResponse>>>(
    (accumulator, [status, response]) => {
      accumulator[Number(status)] = buildResponse(response);
      return accumulator;
    },
    {}
  );

  const request = config.request
    ? {
        params: config.request.params,
        query: config.request.query,
        body: config.request.body
          ? {
              content: {
                "application/json": {
                  schema: config.request.body
                }
              }
            }
          : undefined
      }
    : undefined;

  registry.registerPath({
    method: config.method,
    path: config.path,
    summary: config.summary,
    tags: config.tags,
    request,
    responses: responseDocs,
    security: config.secured === false ? undefined : [{ bearerAuth: [] }]
  });
}
