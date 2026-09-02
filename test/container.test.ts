import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';

import { Container } from '../src/container.js';
import { Inject } from '../src/decorators/inject.js';
import { Injectable } from '../src/decorators/injectable.js';

test('resolves a dependency graph recursively', () => {
  @Injectable()
  class Config {}

  @Injectable()
  class Logger {
    constructor(
      public readonly config: Config,
    ) {}
  }

  @Injectable()
  class UserRepository {
    constructor(
      public readonly logger: Logger,
    ) {}
  }

  @Injectable()
  class UserService {
    constructor(
      public readonly repository: UserRepository,
    ) {}
  }

  const container = new Container();

  const service = container.resolve(UserService);

  assert.ok(service instanceof UserService);
  assert.ok(service.repository instanceof UserRepository);
  assert.ok(service.repository.logger instanceof Logger);
  assert.ok(service.repository.logger.config instanceof Config);
});

test('singleton scope returns the same instance', () => {
  @Injectable()
  class Logger {}

  const container = new Container();

  const first = container.resolve(Logger);
  const second = container.resolve(Logger);

  assert.equal(first, second);
});

test('transient scope returns a new instance', () => {
  @Injectable({ scope: 'transient' })
  class Logger {}

  const container = new Container();

  const first = container.resolve(Logger);
  const second = container.resolve(Logger);

  assert.notEqual(first, second);
});

test('@Inject resolves dependency by explicit token', () => {
  const CONFIG = Symbol.for('CONFIG');

  interface AppConfig {
    port: number;
  }

  @Injectable()
  class Application {
    constructor(
      @Inject(CONFIG)
      public readonly config: AppConfig,
    ) {}
  }

  const config: AppConfig = {
    port: 3000,
  };

  const container = new Container();

  container.register(CONFIG, config);

  const application = container.resolve(Application);

  assert.equal(application.config, config);
  assert.equal(application.config.port, 3000);
});

test('throws a readable error for circular dependencies', () => {
  @Injectable()
  class A {
    constructor(
      public readonly b: unknown,
    ) {}
  }

  @Injectable()
  class B {
    constructor(
      public readonly a: unknown,
    ) {}
  }

  Reflect.defineMetadata(
    'design:paramtypes',
    [B],
    A,
  );

  Reflect.defineMetadata(
    'design:paramtypes',
    [A],
    B,
  );

  const container = new Container();

  assert.throws(
    () => container.resolve(A),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error instanceof RangeError, false);
      assert.match(error.message, /A -> B -> A/);

      return true;
    },
  );
});