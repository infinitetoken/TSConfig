# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages. Holds the compiler flags every repo agrees on (strictness, declaration output, consistent casing). Also ships opt-in `tsup` build config factories for a library, a CLI, or both — see [tsup config](#tsup-config) below.

## Presets

| Export | Use for |
| --- | --- |
| `@infinitetoken/tsconfig` / `@infinitetoken/tsconfig/tsconfig.json` | Universal core — strictness-only flags (`strict`, `declaration`, `noUnusedLocals`, etc). Rarely used directly; every variant below extends it. |
| `@infinitetoken/tsconfig/node` | Node/kit packages, RN library packages (via `/react-native`, below) — `target: esnext`, `module: preserve`, `moduleResolution: bundler`, `types: [jest, node]` |
| `@infinitetoken/tsconfig/server` | Express/server apps (unpublished) — `module: commonjs`, `resolveJsonModule: true`, `types: [jest, node]`, and relaxes six strictness flags (`declaration`, `declarationMap`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) back to `false` |
| `@infinitetoken/tsconfig/react-native` | React Native packages — extends `/node`, adds `target: ES2020`, `lib: [ES2020, DOM]`, `jsx: react-jsx`, `module: ESNext`, `sourceMap: true`, `allowSyntheticDefaultImports: true`, `resolveJsonModule: true` |

## Usage

```json
{
  "extends": "@infinitetoken/tsconfig/node",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

That's the whole file for a typical Node/kit package — every other compiler option now comes from the preset. `rootDir`, `outDir`, `include` (and `exclude`, if you actually need one — see below) are the only things that ever need to be local, because of a real TypeScript limitation: an inherited path-valued `compilerOptions` entry, or an inherited `include`/`exclude`, resolves relative to the file that *declared* it, not the file that extends it. If this package tried to ship `rootDir`/`include`/`exclude` itself, an unoverridden consumer would have TypeScript looking for source files inside `node_modules/@infinitetoken/tsconfig/`. `target`/`module`/`moduleResolution`/`types`/`lib`/etc. don't have this problem — plain `compilerOptions` values merge normally through `extends`, which is exactly why the presets above can carry them for you.

**You very likely don't need an `exclude` array at all.** `include: ["src/**/*"]` already scopes the whole program to `src/` — anything living outside it (`node_modules`, `dist`, `.claude/worktrees`, `examples`, etc.) was never going to be included in the first place, so excluding it again is redundant. Only add `exclude` if you have something that genuinely lives *inside* `src/` that you need to keep out of the program.

`rootDir` specifically can't be dropped even though `include` looks like it should imply it: without it, `tsc`'s declaration-emit output layout breaks (`TS5011`), so it has to stay explicit whenever you're emitting declarations.

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
