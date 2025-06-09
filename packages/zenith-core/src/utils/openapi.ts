import { routeMap } from "../decorators/HttpRoute";
import { validationMap } from "../decorators/ValidateBody";

export function generateOpenAPISpec(): object {
    const paths: Record<string, any> = {};

    for (const [ctor, routes] of routeMap.entries()) {
        for (const { method, path, handlerName } of routes) {
            const schema = validationMap.get(ctor)?.get(handlerName);
            const methodKey = method.toLowerCase();

            if (!paths[path]) paths[path] = {};
            paths[path][methodKey] = {
                summary: `${ctor.name}.${handlerName}`,
                requestBody: schema
                    ? {
                        content: {
                            "application/json": {
                                schema: schema._def, // raw zod schema metadata
                            },
                        },
                    }
                    : undefined,
                responses: {
                    200: { description: "OK" },
                },
            };
        }
    }

    return {
        openapi: "3.0.0",
        info: {
            title: "Zenith Kernel API",
            version: "0.1.0",
        },
        paths,
    };
}
