# omp-extensions

Personal omp extension marketplace.

## Plugins

- **ponytail** — lazy senior dev mode (upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail))
- **caveman** — terse-prose mode, `caveman.ts` vendored here. Off by default (`DEFAULT_CONFIG.defaultLevel`); enable per session with `/caveman lite|full|ultra|micro`, disable with `/caveman off`, and set the default for new sessions via `/caveman config` (persisted to `~/.pi/agent/caveman.json`)
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
