# mini-nest

Власна спрощена версія механізмів NestJS.

## Мета

Ціль проєкту - самостійно реалізувати базові механізми, на яких побудован NestJS.

## Tech stack

- Node.js
- TypeScript
- `reflect-metadata`

## Як це працює

`design:paramtypes` створюється під час компіляції. Коли увімкнено `emitDecoratorMetadata`, компілятор записує типи параметрів конструктора в metadata. Контейнер читає їх за допомогою `Reflect.getMetadata('design:paramtypes', Target)` і сам визначає що треба створити. Без `emitDecoratorMetadata` контейнер не може дізнатись про залежності класу і побудувати граф залежностей.