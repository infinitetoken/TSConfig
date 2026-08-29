# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages, plus opt-in `tsup` build config factories (`./tsup/lib`, `./tsup/cli`, `./tsup/lib-cli`). Part of the `@infinitetoken` shared tooling scope, alongside `@infinitetoken/eslint-config` (`../ESLint-Config`) and `@infinitetoken/jest-config` (`../Jest-Config`).

## File layout

All published files (`tsconfig.json`, `node.json`, `server.json`, `react-native.json`, `tsup/`) live in `src/`, not repo root — same repo-tidiness move as `ESLint-Config`/`Jest-Config`'s `src/` reorg, and (unlike `tsup/`'s own nesting) purely internal: every `package.json` `exports` entry still maps to the same public subpath as before (`.`, `./node`, `./server`, `./react-native`, `./tsup/lib`, etc.), only the right-hand-side file path changed (e.g. `"./node": "./src/node.json"`). `files: ["src"]` is the only publish whitelist entry needed now.

**One real wrinkle this move surfaced, unique to this package among the three:** `@infinitetoken/eslint-config`'s base preset hardcodes `parserOptions.project: './tsconfig.json'` (a fleet-wide convention — every consumer is expected to have a real `tsconfig.json` at repo root for type-aware linting). Before this move, this repo's own dogfooded lint (`eslint.config.cjs` → `@infinitetoken/eslint-config/npm-package`) worked by accident: the *published* preset `tsconfig.json` happened to also sit at root, so it doubled as the local dev/lint project config. Moving the published preset to `src/tsconfig.json` broke that — `eslint .` started failing with `TS5012: Cannot read file '.../tsconfig.json'` on every `test/**/*.ts(x)` fixture. Fixed with a **second, separate, unpublished** root `tsconfig.json` whose only job is satisfying that local convention:

```json
{ "extends": "./src/tsconfig.json" }
```

Not in `files`, so it never ships — `npm pack --dry-run` confirmed the tarball only contains `package.json` + `src/**`. `ESLint-Config` and `Jest-Config` never hit this because they're plain `.cjs`, not TypeScript — they have nothing for the type-aware parser to project against in the first place. Anyone repeating this `src/` move on a *TypeScript* package (not just a `.cjs`/JSON config package) should expect the same wrinkle and add the same thin root pointer.

## Commands

```bash
npm run lint   # ESLint check
npm test       # scripts/verify-presets.cjs (tsc --noEmit against one fixture per preset — see
                # below), then scripts/verify-tsup.cjs (asserts tsup/lib.cjs/tsup/cli.cjs/tsup/lib-cli.cjs's exported shapes and defaults)
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

Compiler flags every consumer of a given preset agrees on belong in that preset file (`src/tsconfig.json`, `src/node.json`, `src/server.json`, `src/react-native.json`) — this now includes `target`/`module`/`moduleResolution`/`types`/`lib`/`jsx`, not just the strictness-only base. What can *never* be centralized, in any preset, no matter how uniform it looks across consumers: `rootDir`, `outDir`, `baseUrl`, `paths`, `include`, `exclude` — any path-valued option. TypeScript resolves an inherited (non-overridden) path-valued option relative to the file that declared it, not the file that extends it — if a preset here shipped `rootDir`/`include`, an unoverridden consumer would have TypeScript looking for source files inside `node_modules/@infinitetoken/tsconfig/`. Verified empirically (not just inferred from docs) by patching an installed copy and watching it fail exactly that way.

A consumer's `tsconfig.json` should therefore normally be just `extends` + `rootDir`/`outDir` + `include` (`exclude` is usually unnecessary — `include: ["src/**/*"]` already scopes the program, so anything outside `src/` was never going to be included regardless). `rootDir` specifically can't be dropped even though `include` looks like it should imply it — omitting it breaks declaration-emit output layout (`TS5011`).

## tsup config (`./tsup/lib`, `./tsup/cli`, `./tsup/lib-cli`)

Lives in this package rather than a separate `@infinitetoken/tsup-config` repo — deliberate, not a scope creep accident. Precedent: `@infinitetoken/eslint-config` already bundles a genuinely different tool (Prettier) under `./prettier` in the same package/repo/version, opt-in via subpath export; nobody's found that confusing. All of these config packages change rarely, so the real cost to weigh is repo/publish/version-pin overhead, not tool purity — a few more subpath exports here are cheaper than a fourth barely-changing repo to keep pinned across the fleet.

Unlike the JSON tsconfig presets above, `tsup.config` files are executable code, so there's no path-resolution sharing limitation to work around — each of these is a plain factory function (`tsup/lib.cjs`, `tsup/cli.cjs`, `tsup/lib-cli.cjs`, each `module.exports = createXConfig`), not a JSON file, and each is `.cjs` specifically (not `.ts`): tsup's own loader (`bundle-require`) ESM-bundles a `.ts` config before running it, so `require()` fails inside one (`import` would be required instead) — a `.cjs` config bypasses that loader entirely and `require()` works normally. Verified empirically this session (scratchpad tests, since cleaned up).

`tsup/lib.cjs` went through two renames before settling: originally flat `tsup.cjs` (subpath `./tsup`), which read as ambiguous once `./tsup-cli`/`./tsup-lib-cli` existed alongside it (lib-only, or "does everything" default?) — renamed to flat `tsup-lib.cjs`/`./tsup-lib` first, then moved again into `tsup/lib.cjs`/`./tsup/lib` once all three flat names (`tsup-lib.cjs`, `tsup-cli.cjs`, `tsup-lib-cli.cjs`) started reading as a family that deserved its own directory rather than three files sharing a string-prefix at repo root next to the actual tsconfig JSON presets. Both renames landed before any publish under the old name had real consumers depending on it (only the very first `./tsup` name briefly existed in a published `v0.2.0`, with five same-session, still-uncommitted consumers) — cheap to fix immediately rather than carry an inconsistent name forward and have to deprecate it properly later.

**Considered, and explicitly rejected: applying the same directory treatment to `ESLint-Config` and `Jest-Config`.** The instinct was that files like `server.cjs`/`react-native.cjs`/`vue.cjs`/`npm-package.cjs` in `ESLint-Config`, or `index.cjs`/`react-native.cjs`/`expo.cjs` in `Jest-Config`, don't say "eslint" or "jest" in their names any more than `node.json` says "tsconfig" here. But those files, unlike `tsup/`'s three files, are all natively about that package's *own* single tool — nesting them under a same-named directory (`eslint-config/eslint/node`, `jest-config/jest/node`) would repeat the package's own name for zero new information, all downside (a longer, stuttering require path) with no upside. The `tsup/` directory earns its keep specifically *because* "tsup" is a different word carrying real information inside the `tsconfig` package — it tells you this is the other tool. Only a file for a genuinely different tool than the package's own namesake (e.g. `ESLint-Config`'s `prettier.cjs`) would be the correct analog — and that's already a single file with an already-unambiguous name (`./prettier`), so there's nothing to gain by nesting it either. Net: `ESLint-Config`/`Jest-Config` stay exactly as they are; this directory pattern is specific to a package hosting more than one genuinely distinct tool, which today is only `TSConfig`.

Every export is a bare function, not an object with named properties — deliberately matches `@infinitetoken/jest-config`'s presets (`module.exports = createJestConfig`, consumer writes `require('@infinitetoken/jest-config/node')()`), not an object a consumer has to invoke one property of by name, and not properties bolted onto the function either (both tried and cut mid-session — see below).

**Which export to use is driven by what the package actually ships, verified via its `package.json`, not assumed from its tsup config shape:**
- No `bin` field, `main`/`exports` point at a real built library → `./tsup/lib` (`createTsupConfig`), single entry, cjs+esm+dts+clean.
- Has a `bin` field, and `main`/`exports` point at that *same* built file (the "package" export IS the CLI, no separate importable API) → `./tsup/cli` (`createTsupCliConfig`), single entry, esm-only, shebang banner, no dts.
- Has a `bin` field, AND `main`/`exports` point at a *different*, genuinely importable build (real exported functions, not just the CLI's internals) → `./tsup/lib-cli` (`createTsupLibCliConfig`), the two-entry array: a lib entry (cjs+esm+dts+clean) plus a cli entry (esm-only, shebang, no dts).

That middle distinction mattered in practice this session: `ReelSort` looked CLI-only from its tsup config alone (one array entry named `cli.ts` easy to miss next to `index.ts`), but its `package.json` `exports` actually point at a real `dist/index.js` exporting real functions (`clean`, `configSet`, `history`, `list`, `rename`, etc.) — it's `tsup/lib-cli`, not `tsup/cli`. Conversely `Deplace`'s `main`/`exports` both point straight at `dist/cli.js`, and its `src/index.ts` is nothing but `run(process.argv)` — no separate library at all, genuinely `tsup/cli` shaped. Always check `bin`/`main`/`exports`, don't infer from the tsup config or file names alone.

**`./tsup/lib-cli` exists because of real, verified fleet duplication, not speculation** — `GraPDF`, `SnaPDF`, `Pixelated`, and `ReelSort` all ship a real library plus a CLI bin, and their lib entries already matched `createTsupConfig`'s defaults exactly (cjs+esm+dts+clean) before this export existed. Their cli entries matched each other too (esm-only, shebang banner, no dts) in 3 of 4 — `ReelSort`'s cli entry was `format: ['cjs']` instead, with no structural reason for the difference (checked: all four have `"type": "commonjs"` in `package.json`, identical to each other) — confirmed unintentional drift, not a deliberate variant, so `createTsupLibCliConfig`'s defaults follow the 3-of-4 shape and `ReelSort` needs to override `cli: { format: ['cjs'] }` — or better, get realigned to `esm` like the others when it migrates, rather than the shared default chasing its outlier.

An earlier draft this session shipped `entryConfig`/`cliConfig`/`defineConfig` alongside `createTsupConfig` (first as named object properties, then as properties bolted onto the function itself) to support composing a multi-entry array by hand — cut before publishing, because at that point no real consumer's actual shape had been checked yet, so it was speculative surface area. `./tsup/lib-cli` looks superficially similar (it also produces a multi-entry array) but isn't the same mistake: it exists because four real packages' `package.json` files were actually read and their entries actually compared, not because a shape seemed plausible in the abstract. A package with an entry beyond the lib+cli pair (`Pixelated`'s extra `shapes.ts`) spreads the array and appends its own rather than needing a new factory: `defineConfig([...createTsupLibCliConfig(), extraEntry])`.

**`./tsup/cli` is modeled on the CLI half of the `tsup/lib-cli` packages (`GraPDF`/`SnaPDF`/`Pixelated`), not on `Deplace`/`Reunite`** — the fleet's only two currently-CLI-only packages. Checked and found genuinely divergent from each other, not just from this new default: `Deplace` is `cjs` with the shebang delivered via tsup's own `banner` option; `Reunite` is `esm` with the shebang delivered a different way entirely (a hand-written `bin/cli.mjs` wrapper that `import`s the built `dist/cli.mjs`, no tsup `banner` at all), plus `outExtension`/`bundle`/`target` options neither of the others use. Both are older than the `tsup/lib-cli` packages (2018 vs. 2026). Per the fleet-wide convention direction: `Deplace` and `Reunite` are the ones that need realigning onto `./tsup/cli`'s shape (and onto one one canonical shebang-delivery mechanism, still an open decision), not the other way around — deliberately not done yet, tracked as follow-up work, not scope for this export's initial shape.

`dts` IS defaulted `true` on every entry that represents real importable code, across all three exports, because of a real bug found and fixed fleet-wide this session: a package doing `tsup && tsc --emitDeclarationOnly` as two separate build steps — instead of tsup's own entry-scoped `dts: true` — ends up with `tsc` emitting declarations for everything `tsconfig.json`'s `include` matches, not just the real entry point, which means `dist/__tests__/*.d.ts` genuinely ships in the published npm tarball (confirmed via `npm pack --dry-run` on 4 affected packages: `Lumber-Node`, `CashierFu-Kit`, `Cosmetic`, `Pixelated`). `dts` is never defaulted on a cli entry in any export — nobody imports a bin as a typed library.

`tsup` is a `peerDependency` (optional — most consumers of this package don't use tsup at all) rather than a bundled `dependency`, same pattern as `eslint`/`jest` in the sibling config packages: each consumer should track its own installed tsup version, not one pinned by this package.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```

The `publish.yml` workflow fires on `v*` tags and runs `npm publish`.
