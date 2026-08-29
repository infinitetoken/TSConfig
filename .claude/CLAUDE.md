# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages, plus an opt-in `tsup` build config factory (`./tsup`). Part of the `@infinitetoken` shared tooling scope, alongside `@infinitetoken/eslint-config` (`../ESLint-Config`) and `@infinitetoken/jest-config` (`../Jest-Config`).

## Commands

```bash
npm run lint   # ESLint check
npm test       # scripts/verify-presets.cjs (tsc --noEmit against one fixture per preset — see
                # below), then scripts/verify-tsup.cjs (asserts tsup.cjs's exported shapes and defaults)
npm run verify # lint + test
```

### Preset fixtures (`test/`)

One directory per preset (`test/base`, `test/node`, `test/server`, `test/react-native`), each with its own `tsconfig.json` extending that preset and a fixture file that only compiles *because* of that preset's distinguishing options — not just "doesn't error," which any preset would pass:

- `test/base` — the original smoke test: trivially-valid code under the bare strictness-only preset.
- `test/node` — references `process`/`Buffer`, proving `types: ["node"]` resolves.
- `test/server` — imports a local `.json` file (`resolveJsonModule`), and has a function missing a `return` on one branch, which only compiles because `server.json` relaxes `noImplicitReturns` — verified empirically that the identical fixture fails with `TS7030` under `node.json`.
- `test/react-native` — a bare `<div />` (not a native RN primitive) in a `.tsx` file, which only type-checks because `lib: DOM` supplies `HTMLDivElement` for the JSX intrinsic-element type *and* `jsx: react-jsx` is what lets the JSX syntax parse at all.

`test/node`, `test/server`, and `test/react-native` all extend a preset with `types: ["jest", "node"]` (or, for react-native, need `@types/react`/`react` for the JSX runtime types) — this package therefore has `@types/node`, `@types/jest`, `react`, and `@types/react` as devDependencies purely to make its own preset self-test real, the same way `Jest-Config` pulls in `expo`/`jest-expo`/`babel-preset-expo` to dogfood its `/expo` preset. None of it ships (`files` only whitelists the actual preset/config files); real consumers already have this weight installed via their own package.

## Presets

| Export | Use for |
| --- | --- |
| `.` / `./tsconfig.json` | Universal core — strictness-only flags (`strict`, `declaration`, `declarationMap`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `preserveConstEnums`, `skipLibCheck`). Rarely extended directly. |
| `./node` | Node/kit packages — `target: esnext`, `module: preserve`, `moduleResolution: bundler`, `types: [jest, node]` |
| `./server` | Express/server apps (unpublished) — `module: commonjs`, `resolveJsonModule: true`, `types: [jest, node]`, relaxes six strictness flags back to `false` (`declaration`, `declarationMap`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) |
| `./react-native` | React Native packages — extends `./node`, adds `target: ES2020`, `lib: [ES2020, DOM]`, `jsx: react-jsx`, `module: ESNext`, `sourceMap: true`, `allowSyntheticDefaultImports: true`, `resolveJsonModule: true` |

## What belongs here vs. what stays local

Compiler flags every consumer of a given preset agrees on belong in that preset file (`tsconfig.json`, `node.json`, `server.json`, `react-native.json`) — this now includes `target`/`module`/`moduleResolution`/`types`/`lib`/`jsx`, not just the strictness-only base. What can *never* be centralized, in any preset, no matter how uniform it looks across consumers: `rootDir`, `outDir`, `baseUrl`, `paths`, `include`, `exclude` — any path-valued option. TypeScript resolves an inherited (non-overridden) path-valued option relative to the file that declared it, not the file that extends it — if a preset here shipped `rootDir`/`include`, an unoverridden consumer would have TypeScript looking for source files inside `node_modules/@infinitetoken/tsconfig/`. Verified empirically (not just inferred from docs) by patching an installed copy and watching it fail exactly that way.

A consumer's `tsconfig.json` should therefore normally be just `extends` + `rootDir`/`outDir` + `include` (`exclude` is usually unnecessary — `include: ["src/**/*"]` already scopes the program, so anything outside `src/` was never going to be included regardless). `rootDir` specifically can't be dropped even though `include` looks like it should imply it — omitting it breaks declaration-emit output layout (`TS5011`).

## tsup config (`./tsup`)

Lives in this package rather than a separate `@infinitetoken/tsup-config` repo — deliberate, not a scope creep accident. Precedent: `@infinitetoken/eslint-config` already bundles a genuinely different tool (Prettier) under `./prettier` in the same package/repo/version, opt-in via subpath export; nobody's found that confusing. All of these config packages change rarely, so the real cost to weigh is repo/publish/version-pin overhead, not tool purity — one more subpath export here is cheaper than a fourth barely-changing repo to keep pinned across the fleet.

Unlike the JSON tsconfig presets above, `tsup.config` files are executable code, so there's no path-resolution sharing limitation to work around — this is a plain factory function (`tsup.cjs`, `module.exports = createTsupConfig`), not a JSON file, and it's `.cjs` specifically (not `.ts`): tsup's own loader (`bundle-require`) ESM-bundles a `.ts` config before running it, so `require()` fails inside one (`import` would be required instead) — a `.cjs` config bypasses that loader entirely and `require()` works normally. Verified empirically this session (scratchpad tests, since cleaned up).

The export is a bare function, not an object with named properties — deliberately matches `@infinitetoken/jest-config`'s presets (`module.exports = createJestConfig`, consumer writes `require('@infinitetoken/jest-config/node')()`), not an object a consumer has to invoke one property of by name. An earlier draft this session shipped `entryConfig`/`cliConfig`/`defineConfig` alongside `createTsupConfig` (first as named object properties, then as properties bolted onto the function itself) to support composing a multi-entry `defineConfig([...])` array by hand (a library entry plus a CLI bin, say) — cut before publishing: no migrated consumer needs multi-entry support yet, so it was speculative surface area for a need that doesn't exist. A multi-entry package should still write `tsup.config.cjs` by hand with `tsup`'s own `defineConfig([...])`, same as before this package existed; revisit a shared multi-entry helper only when a real consumer needs one, not preemptively.

`dts` IS defaulted `true` in `createTsupConfig` because of a real bug found and fixed fleet-wide this session: a package doing `tsup && tsc --emitDeclarationOnly` as two separate build steps — instead of tsup's own entry-scoped `dts: true` — ends up with `tsc` emitting declarations for everything `tsconfig.json`'s `include` matches, not just the real entry point, which means `dist/__tests__/*.d.ts` genuinely ships in the published npm tarball (confirmed via `npm pack --dry-run` on 4 affected packages: `Lumber-Node`, `CashierFu-Kit`, `Cosmetic`, `Pixelated`).

`tsup` is a `peerDependency` (optional — most consumers of this package don't use tsup at all) rather than a bundled `dependency`, same pattern as `eslint`/`jest` in the sibling config packages: each consumer should track its own installed tsup version, not one pinned by this package.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```

The `publish.yml` workflow fires on `v*` tags and runs `npm publish`.
