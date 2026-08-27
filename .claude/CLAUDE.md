# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages. Part of the `@infinitetoken` shared tooling scope, alongside `@infinitetoken/eslint-config` (`../ESLint-Config`).

## Commands

```bash
npm test    # tsc --noEmit against test/fixture.ts, which extends tsconfig.json
npm run ci  # same as npm test
```

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```

The `publish.yml` workflow fires on `v*` tags and runs `npm publish`.

## What belongs here

Only compiler flags every consumer agrees on: strictness (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, etc.), declaration output, consistent casing. Build-mechanics options that vary per repo (`target`, `module`, `moduleResolution`, `rootDir`, `types`, `include`/`exclude`) belong in the consumer's own `tsconfig.json`, not here.
