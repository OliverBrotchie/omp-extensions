# omp-extensions

Personal omp extension marketplace.

## Plugins

- **ponytail** — lazy senior dev mode (upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail))
- **caveman** — terse-prose mode, `caveman.ts` vendored here
- **guardrails** — blocks agent edits to `AGENTS.md` (write/edit tools and bash write-intents); the file stays human-owned

## Install

```sh
omp plugin marketplace add oliverbrotchie/omp-extensions
omp plugin install ponytail@omp-extensions caveman@omp-extensions guardrails@omp-extensions
```

Update after upstream or catalog changes:

```sh
omp plugin marketplace update omp-extensions   # refresh the catalog + sources
omp plugin upgrade ponytail@omp-extensions caveman@omp-extensions guardrails@omp-extensions
```

## Layout

```
.omp-plugin/marketplace.json   ← catalog
plugins/caveman/               ← vendored caveman.ts + package.json (omp.extensions)
plugins/guardrails/            ← AGENTS.md guard hook + package.json (omp.extensions)
```
