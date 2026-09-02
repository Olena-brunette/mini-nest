import 'reflect-metadata';
import {
  INJECTABLE_METADATA,
  INJECT_TOKENS_METADATA,
  SCOPE_METADATA,
} from './tokens.js';
import type {
  InjectionToken,
} from './decorators/inject.js';
import type {
  Scope,
} from './decorators/injectable.js';

type Constructor<T = unknown> =
  new (...args: any[]) => T;

type ValueToken = string | symbol;

export class Container {
  private readonly providers =
    new Map<InjectionToken, unknown>();

  private readonly singletons =
    new Map<InjectionToken, unknown>();

  register<T>(
    token: InjectionToken,
    value: T,
  ): void {
    this.providers.set(token, value);
  }

  resolve<T>(token: Constructor<T>): T;

  resolve<T = unknown>(
    token: ValueToken,
  ): T;

  resolve<T>(
    token: InjectionToken,
  ): T {
    return this.resolveToken<T>(
      token,
      [],
    );
  }

  private resolveToken<T>(
    token: InjectionToken,
    path: InjectionToken[],
  ): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    if (this.providers.has(token)) {
      return this.providers.get(token) as T;
    }

    if (typeof token !== 'function') {
      throw new Error(
        `Provider for token "${String(token)}" is not registered`,
      );
    }

    return this.resolveClass<T>(
      token as Constructor<T>,
      path,
    );
  }

  private resolveClass<T>(
    Target: Constructor<T>,
    path: InjectionToken[],
  ): T {
    if (path.includes(Target)) {
      const cycle = [...path, Target]
        .map((token) => this.getTokenName(token))
        .join(' -> ');

      throw new Error(
        `Circular dependency detected: ${cycle}`,
      );
    }

    const isInjectable =
      Reflect.getMetadata(
        INJECTABLE_METADATA,
        Target,
      ) as boolean | undefined;

    if (!isInjectable) {
      throw new Error(
        `${Target.name} is not marked with @Injectable()`,
      );
    }

    const scope =
      (Reflect.getMetadata(
        SCOPE_METADATA,
        Target,
      ) as Scope | undefined) ??
      'singleton';

    if (
      scope === 'singleton' &&
      this.singletons.has(Target)
    ) {
      return this.singletons.get(Target) as T;
    }

    const paramTypes =
      (Reflect.getMetadata(
        'design:paramtypes',
        Target,
      ) as InjectionToken[] | undefined) ??
      [];

    const injectedTokens =
      (Reflect.getOwnMetadata(
        INJECT_TOKENS_METADATA,
        Target,
      ) as
        | Map<number, InjectionToken>
        | undefined) ??
      new Map<number, InjectionToken>();

    const nextPath = [
      ...path,
      Target,
    ];

    const dependencies =
      paramTypes.map(
        (paramType, index) => {
          const dependencyToken =
            injectedTokens.get(index) ??
            paramType;

          return this.resolveToken(
            dependencyToken,
            nextPath,
          );
        },
      );

    const instance =
      new Target(...dependencies);

    if (scope === 'singleton') {
      this.singletons.set(
        Target,
        instance,
      );
    }

    return instance;
  }

  private getTokenName(
    token: InjectionToken,
  ): string {
    if (typeof token === 'function') {
      return token.name;
    }

    return String(token);
  }
}