import 'reflect-metadata';
import { INJECT_TOKENS_METADATA } from '../tokens.js';

export type InjectionToken =
  | string
  | symbol
  | (new (...args: any[]) => unknown);

export function Inject(token: InjectionToken): ParameterDecorator {
  return (
    target,
    _propertyKey,
    parameterIndex,
  ) => {
    const tokens: Map<number, InjectionToken> =
      Reflect.getOwnMetadata(
        INJECT_TOKENS_METADATA,
        target,
      ) ?? new Map<number, InjectionToken>();

    tokens.set(parameterIndex, token);

    Reflect.defineMetadata(
      INJECT_TOKENS_METADATA,
      tokens,
      target,
    );
  };
}