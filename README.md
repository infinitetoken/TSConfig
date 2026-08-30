# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages. Holds the compiler flags every repo agrees on (strictness, declaration output, consistent casing). Also ships opt-in `tsup` build config factories for a library, a CLI, or both — see [tsup config](#tsup-config) below.

## Presets

| Export | Use for |
| --- | --- |
| `@infinitetoken/tsconfig` / `@infinitetoken/tsconfig/tsconfig.json` | Universal core — strictness-only flags (`strict`, `declaration`, `noUnusedLocals`, etc). Rarely used directly; every variant below extends it. |
| `@infinitetoken/tsconfig/node` | Node/kit packages, RN library packages (via `/react-native`, below) — `target: esnext`, `module: preserve`, `moduleResolution: bundler`, `types: [jest, node]` |
| `@infinitetoken/tsconfig/server` | Express/server apps (unpublished) — `module: commonjs`, `resolveJsonModule: true`, `types: [jest, node]`, and relaxes six strictness flags (`declaration`, `declarationMap`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) back to `false` |
| `@infinitetoken/tsconfig/react-native` | React Native packages (bare RN, and RN libraries published to npm) — extends `/node`, adds `target: ESNext`, `lib: [DOM, ESNext]`, `jsx: react-jsx`, `sourceMap: true`, `allowSyntheticDefaultImports: true`, `resolveJsonModule: true`, `noEmit: true`, `customConditions: [react-native]` |
| `@infinitetoken/tsconfig/expo` | Expo apps — extends `/react-native`, adds `moduleDetection: force`, `allowJs: true` |

## Usage

```json
{
  "extends": "@infinitetoken/tsconfig/node",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

That's the whole file for a package that builds with `tsup` (and its `dts: true`, via [`@infinitetoken/tsconfig/tsup/lib`](#tsup-config) below) — every other compiler option now comes from the preset. `rootDir`/`include` (and `exclude`, if you actually need one, and `outDir` if `tsc` itself ever emits — see below) are the only things that ever need to be local, because of a real TypeScript limitation: an inherited path-valued `compilerOptions` entry, or an inherited `include`/`exclude`, resolves relative to the file that *declared* it, not the file that extends it. If this package tried to ship `rootDir`/`include`/`exclude` itself, an unoverridden consumer would have TypeScript looking for source files inside `node_modules/@infinitetoken/tsconfig/`. `target`/`module`/`moduleResolution`/`types`/`lib`/etc. don't have this problem — plain `compilerOptions` values merge normally through `extends`, which is exactly why the presets above can carry them for you.

**You very likely don't need an `exclude` array at all.** `include: ["src/**/*"]` already scopes the whole program to `src/` — anything living outside it (`node_modules`, `dist`, `.claude/worktrees`, `examples`, etc.) was never going to be included in the first place, so excluding it again is redundant. Only add `exclude` if you have something that genuinely lives *inside* `src/` that you need to keep out of the program.

**You very likely don't need `outDir` either, for the same reason.** It's only load-bearing when `tsc` itself emits — `--emitDeclarationOnly`, or a plain build via `tsc`. If the package builds with `tsup` and lets its own `dts: true` handle declarations (the normal setup in this fleet — see [tsup config](#tsup-config)), `tsc` only ever runs `--noEmit` for type-checking, and `outDir` has nothing to do — confirmed with a byte-identical `dist/` diff with and without it. Add it back only if `typecheck`/`build` genuinely calls `tsc` without `--noEmit`.

**`rootDir` is narrower than the note above once said — it's only required when something runs `tsc` with actual declaration emission enabled** (`--declaration`/`--emitDeclarationOnly`, or a plain non-`--noEmit` build): without it, that specific invocation fails with `TS5011` ("the common source directory... rootDir must be explicitly set"). Verified directly: raw `tsc --declaration --emitDeclarationOnly` throws `TS5011` on a `rootDir`-less config, every time. But `tsup`'s own `dts: true` step does **not** go through this same check — confirmed by running `npx tsup --dts` directly against a `rootDir`-less config: clean build, byte-identical output, no error or warning. So in the fleet's actual, normal setup (`typecheck` = `tsc --noEmit` only, `build` = `tsup`), neither script ever emits declarations via raw `tsc`, and `rootDir` genuinely is dead weight — confirmed with byte-identical `dist/` diffs across every repo in the fleet audited so far. Add it back only if a script in this specific package ever runs `tsc` with declaration emission directly (not through `tsup`) — check `package.json`'s scripts, don't assume.

**`react-native`/`expo` consumers don't need to think about any of this** — those two presets set `noEmit: true` themselves, because an Expo/RN app's own `tsc` is always typecheck-only (Metro/EAS does the actual build), so a bare `"typecheck": "tsc"` script just works with no flags and no `rootDir`/`outDir`.

A typical Expo app's `tsconfig.json` — `paths` still has to be written out by hand (path-valued options can't be centralized, same rule as above), but this is the shape that's converged on independently across every real Expo app in this fleet:

```json
{
  "extends": "@infinitetoken/tsconfig/expo",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "types": ["react-native", "jest"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": [".claude/worktrees/**"]
}
```

A few things worth knowing before copying this in:
- `include` is repo-root-scoped (`**/*.ts`/`**/*.tsx`), not `src/**/*` — the `"@/*": ["./*"]` root alias implies files outside `src/` (app config, root scripts) may need to type-check too.
- `types` has to be the app's own full list regardless of what `expo`/`react-native` set — TypeScript's `types` option is fully replaced, not merged, by the most-derived config. Only add `"node"` to it if `@types/node` is actually installed — otherwise `tsc` fails immediately with "Cannot find type definition file for 'node'."
- Add your own real folder aliases to `paths` (`@/redux/*`, `@/context/*`, etc.) — the three above are just examples.
- **If `app.json` has `"experiments": { "typedRoutes": true }`,** also add `".expo/types/**/*.ts"` and `"expo-env.d.ts"` to `include`. TypeScript's `include` globs don't traverse dot-directories by default (verified directly — `**/*.ts` silently skips anything under `.expo/`), so without that entry `tsc` won't see Expo Router's generated route-param types. It's not a hard failure either way — `Href` just falls back to a looser, unchecked type — but it is a silent loss of the type-checking the feature is supposed to provide.
- **The first migration in an app almost never a pure config swap.** `expo/tsconfig.base` (what every app currently extends) sets no strictness at all — `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` all come from `@infinitetoken/tsconfig`'s base preset, for the first time, the moment an app switches. Expect real, pre-existing violations to surface immediately (unused `React` imports left over from before the new JSX transform, unused variables, a branch genuinely missing a `return`) — verified directly against one real app in this fleet, which surfaced 10 such errors on the first `tsc` run. Budget a small cleanup pass per app, not just a one-line `extends` change.

## tsup config

Opt-in — only relevant if the package builds with `tsup`. Unlike `tsconfig.json`, a `tsup.config` file is executable code with no path-resolution sharing limitation, so these are plain factory functions — same shape as `@infinitetoken/jest-config`'s presets, a bare function you call, nothing invoked by name off an object. Use a `tsup.config.cjs` (not `.ts`) so it loads directly with `require()` instead of going through tsup's ESM-bundling loader. Pick the export that matches what the package actually ships:

| Export | Use for |
| --- | --- |
| `@infinitetoken/tsconfig/tsup/lib` | A library with no CLI — one entry, cjs+esm, declarations, cleans `dist/` |
| `@infinitetoken/tsconfig/tsup/cli` | A CLI with no separate library export (`main`/`exports` point straight at the built bin) — one entry, esm-only, Node shebang banner, no declarations |
| `@infinitetoken/tsconfig/tsup/lib-cli` | A package that ships both — a real, separately-importable library **and** a CLI bin — the library entry (cjs+esm, declarations, cleans `dist/`) plus the CLI entry (esm-only, shebang, no declarations) |

The plain library case — one entry point, nothing else:

```js
// tsup.config.cjs
module.exports = require('@infinitetoken/tsconfig/tsup/lib')()
```

Pass a different entry or override anything tsup accepts: `require('@infinitetoken/tsconfig/tsup/lib')('src/main.ts', { minify: true })`.

A CLI-only package:

```js
// tsup.config.cjs
module.exports = require('@infinitetoken/tsconfig/tsup/cli')()
```

A package with both a library and a CLI:

```js
// tsup.config.cjs
module.exports = require('@infinitetoken/tsconfig/tsup/lib-cli')()
```

That returns the full two-entry array (`createTsupLibCliConfig(libEntry?, cliEntry?, { lib?, cli? })` — defaults to `src/index.ts` / `src/cli.ts`). A package with an extra entry beyond those two (e.g. a separate subpath export) can spread it and append its own:

```js
// tsup.config.cjs
const { defineConfig } = require('tsup')
const createTsupLibCliConfig = require('@infinitetoken/tsconfig/tsup/lib-cli')

module.exports = defineConfig([...createTsupLibCliConfig(), { entry: ['src/shapes.ts'], format: ['esm', 'cjs'], dts: true }])
```

All three default `dts: true` on every entry that represents real importable code (never on a CLI entry — nobody imports a bin as a typed library) — a package doing `tsup && tsc --emitDeclarationOnly` as two separate steps, rather than letting tsup's own entry-scoped `dts` option handle it, will end up shipping declarations for every file `tsconfig.json`'s `include` matches, `__tests__` included, not just the real entry point.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
