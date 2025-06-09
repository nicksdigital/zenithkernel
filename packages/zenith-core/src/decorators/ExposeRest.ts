import { RegisterSystem } from "./RegisterSystem";

/**
 * Combines @RegisterSystem and marks system for HTTP exposure.
 */
export function ExposeRest(id: string, dependsOn: string[] = []): ClassDecorator {
    return function (target: any) {
        RegisterSystem(id, dependsOn)(target);
        // future: could flag for auto REST mount here if needed
    };
}
