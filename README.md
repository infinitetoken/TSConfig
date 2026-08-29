# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages. Holds the compiler flags every repo agrees on (strictness, declaration output, consistent casing). Also ships an opt-in `tsup` build config factory (`@infinitetoken/tsconfig/tsup`) — see [tsup config](#tsup-config) below.

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

Opt-in — only relevant if the package builds with `tsup`. Unlike `tsconfig.json`, a `tsup.config` file is executable code with no path-resolution sharing limitation, so this is a plain factory function, not a JSON preset. Use a `tsup.config.cjs` (not `.ts`) so it loads directly with `require()` instead of going through tsup's ESM-bundling loader.

The common case — one library entry, cjs+esm, with declarations, cleaning `dist/` first:

```js
// tsup.config.cjs
module.exports = require('@infinitetoken/tsconfig/tsup').createTsupConfig()
```

For a package with more than one entry point (e.g. a library plus a CLI bin), compose `entryConfig`/`cliConfig` yourself. Only the first entry should set `clean: true` — later entries with `clean: true` would wipe out what the earlier ones just wrote:

```js
// tsup.config.cjs
const { defineConfig, entryConfig, cliConfig } = require('@infinitetoken/tsconfig/tsup')

module.exports = defineConfig([
  entryConfig('src/index.ts', { clean: true }),
  entryConfig('src/shapes.ts'),
  cliConfig('src/cli.ts')
])
```

`createTsupConfig(entry?, overrides?)` and `entryConfig` both default `dts: true` — a package doing `tsup && tsc --emitDeclarationOnly` as two separate steps (rather than letting tsup's own entry-scoped `dts` option handle it) will end up shipping declarations for every file `tsconfig.json`'s `include` matches, `__tests__` included, not just the real entry point.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
