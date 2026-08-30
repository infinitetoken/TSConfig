/* eslint-disable no-console */
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const tscBin = require.resolve('typescript/bin/tsc')

// base/node/server presets don't set `noEmit` themselves — real consumers of
// those (library packages building with tsup) pass `--noEmit` explicitly in
// their own typecheck script, so that's what's verified here too.
//
// react-native/expo presets DO set `noEmit: true` themselves, because real
// consumers (Expo/RN apps) run a bare `tsc` with no flags. Omitting
// `--noEmit` here on purpose is the regression test for that: verified
// empirically that without it, `declaration: true` (from the base preset)
// with no `rootDir` set doesn't necessarily throw TS5011 — a single-root-file
// fixture has no "common source directory" ambiguity to trip that check, so
// `tsc` instead silently emits build output straight into the fixture
// directory. The expo fixture's plain-JS import (only resolvable because of
// `allowJs`) does reliably hard-fail instead, with TS5055 ("would overwrite
// input file"), since declaration+JS emission for that file collides with
// its own source path with no `outDir` set. Either way, a preset silently
// losing `noEmit` shows up here — as a hard error or as stray tracked-looking
// files a `git status` after `npm test` would catch.
const presets = [
  { name: 'base', cliNoEmit: true },
  { name: 'node', cliNoEmit: true },
  { name: 'server', cliNoEmit: true },
  { name: 'react-native', cliNoEmit: false },
  { name: 'expo', cliNoEmit: false }
]

for (const { name, cliNoEmit } of presets) {
  const tsconfigPath = path.join(__dirname, '..', 'test', name, 'tsconfig.json')
  const args = [tscBin, ...(cliNoEmit ? ['--noEmit'] : []), '-p', tsconfigPath]
  execFileSync(process.execPath, args, { stdio: 'inherit' })
  console.log(`test/${name}: OK`)
}
