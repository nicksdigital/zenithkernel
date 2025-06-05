export interface RouteBinding {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    handlerName: string;
}

export const routeMap = new Map<any, RouteBinding[]>();

// ✅ Correct method decorator signature
export function HttpRoute(method: RouteBinding["method"], path: string): MethodDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        _descriptor: TypedPropertyDescriptor<any>
    ): void {
        const ctor = target.constructor;
        if (!routeMap.has(ctor)) routeMap.set(ctor, []);
        routeMap.get(ctor)!.push({
            method,
            path,
            handlerName: propertyKey.toString()
        });
    };
}
