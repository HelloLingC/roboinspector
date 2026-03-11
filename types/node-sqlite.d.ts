declare module "node:sqlite" {
  export interface StatementSync {
    all<T = unknown>(...anonymousParameters: unknown[]): T[];
    get<T = unknown>(...anonymousParameters: unknown[]): T | undefined;
    run(...anonymousParameters: unknown[]): void;
  }

  export interface DatabaseSyncOptions {
    readonly?: boolean;
    create?: boolean;
    timeout?: number;
    readBigInts?: boolean;
    returnArrays?: boolean;
    allowBareNamedParameters?: boolean;
    allowUnknownNamedParameters?: boolean;
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
