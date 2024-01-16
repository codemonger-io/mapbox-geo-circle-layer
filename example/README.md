English / [日本語](./README.ja.md)

# mapbox-geo-circle-layer example

This is an example of how to use `mapbox-geo-circle-layer`.

Please see [`src/components/TheMap.vue`](./src/components/TheMap.vue).

## Configuring the Mapbox access token

You have to configure the Mapbox access token in `src/configs/mapbox-config.ts`.
The file is never pushed to the repository, but you can find an example in [`src/configs/mapbox-config.example.ts`](./src/configs/mapbox-config.example.ts).

```ts
export default {
  accessToken: 'Your Mapbox access token here'
}
```

## Resolving dependencies

```sh
npm install
```

### Running dev server

```sh
npm run dev
```

### Type-checking

```sh
npm run type-check
```

### Linting with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Formatting with [Prettier](https://prettier.io)

```sh
npm run format
```