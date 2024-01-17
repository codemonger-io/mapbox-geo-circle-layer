English / [日本語](./CHANGELOG.ja.md)

# Changelog

## 0.2.0

### Breaking changes

- The `alpha` component of `fill` is multiplied to the other three components before blending with the underlying layers.
  You no longer need to premultiply `alpha` yourself to get the "normal" alpha-blending effect. [#11](https://github.com/codemonger-io/mapbox-geo-circle-layer/issues/11)

## 0.1.1

Mapbox GL JS was bumped to v3.0.1.
No API changes, and Mapbox GL JS v2.x is also supported.

## 0.1.0

Initial release.