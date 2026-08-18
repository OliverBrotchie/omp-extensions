# omp-extensions

Personal omp extension marketplace.

## Plugins

- **ponytail** — lazy senior dev mode (upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail))
- **caveman** — terse-prose mode, `caveman.ts` vendored here

## Install

```sh
omp plugin marketplace add oliverbrotchie/omp-extensions
omp plugin install ponytail@omp-extensions caveman@omp-extensions
```

Update after upstream or catalog changes:

```sh
omp plugin marketplace update omp-extensions
```

## Layout

```
.omp-plugin/marketplace.json   ← catalog
plugins/caveman/               ← vendored caveman.ts + package.json (omp.extensions)
```
