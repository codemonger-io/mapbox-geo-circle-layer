[English](./README.md) / 日本語

# mapbox-geo-circle-layerサンプル

`mapbox-geo-circle-layer`の使い方のサンプルです。

[`src/components/TheMap.vue`](./src/components/TheMap.vue)をご覧ください。

## Mapboxアクセストークンの設定

Mapboxアクセストークンを`src/configs/mapbox-config.ts`に設定しなければなりません。
このファイルはレポジトリにプッシュされませんが、[`src/configs/mapbox-config.example.ts`](./src/configs/mapbox-config.example.ts)にサンプルがあります。

```ts
export default {
  accessToken: 'Your Mapbox access token here'
}
```

## 依存関係の解決

```sh
npm install
```

### 開発サーバーの実行

```sh
npm run dev
```

### タイプチェック

```sh
npm run type-check
```

### [ESLint](https://eslint.org/)でコードチェック

```sh
npm run lint
```

### [Prettier](https://prettier.io)でコード整形

```sh
npm run format
```