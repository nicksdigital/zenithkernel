import { z } from "zod";

// Stores validation schemas: Map<Class, Map<handlerName, zodSchema>>
export const validationMap = new Map<any, Map<string, z.ZodSchema>>();

export function ValidateBody(schema: z.ZodSchema): MethodDecorator {
    return (target, key, _desc) => {
        const ctor = target.constructor;
        if (!validationMap.has(ctor)) validationMap.set(ctor, new Map());
        validationMap.get(ctor)!.set(key as string, schema);
    };
}
