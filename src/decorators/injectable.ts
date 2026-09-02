import 'reflect-metadata';
import {
  INJECTABLE_METADATA,
  SCOPE_METADATA,
} from '../tokens.js';

export type Scope = 'singleton' | 'transient';

export interface InjectableOptions {
  scope?: Scope;
}

export function Injectable(
  options: InjectableOptions = {},
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      INJECTABLE_METADATA,
      true,
      target,
    );

    Reflect.defineMetadata(
      SCOPE_METADATA,
      options.scope ?? 'singleton',
      target,
    );
  };
}