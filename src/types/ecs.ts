export type Entity = number;

export type ComponentType<T> = { new (): T };

export interface ComponentMap {
    [componentName: string]: Map<Entity, unknown>;
}
