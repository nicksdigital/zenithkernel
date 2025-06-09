export type Entity = number;

export type Constructor<T> = new (...args: any[]) => T;
export type ComponentType<T> = new (...args: any[]) => T;
