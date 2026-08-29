/* eslint-disable no-console */
const assert = require('node:assert/strict')

const { createTsupConfig, entryConfig, cliConfig, defineConfig } = require('../tsup.cjs')

assert.equal(typeof createTsupConfig, 'function', 'tsup.cjs should export createTsupConfig as a function')
assert.equal(typeof entryConfig, 'function', 'tsup.cjs should export entryConfig as a function')
assert.equal(typeof cliConfig, 'function', 'tsup.cjs should export cliConfig as a function')
assert.equal(typeof defineConfig, 'function', "tsup.cjs should re-export tsup's own defineConfig")

const base = createTsupConfig()
assert.deepEqual(base.entry, ['src/index.ts'], 'createTsupConfig should default entry to src/index.ts')
assert.deepEqual(base.format, ['cjs', 'esm'], 'createTsupConfig should default format to cjs+esm')
assert.equal(base.dts, true, 'createTsupConfig should default dts to true')
assert.equal(base.clean, true, 'createTsupConfig should default clean to true')
console.log('createTsupConfig(): OK')

const customEntry = createTsupConfig('src/main.ts', { minify: true })
assert.deepEqual(customEntry.entry, ['src/main.ts'], 'createTsupConfig should accept a custom entry')
assert.equal(customEntry.minify, true, 'createTsupConfig overrides should merge on top')
assert.equal(customEntry.dts, true, 'createTsupConfig overrides should not clobber unrelated defaults')
console.log('createTsupConfig(entry, overrides): OK')

const entry = entryConfig(['src/index.ts', 'src/shapes.ts'])
assert.deepEqual(entry.entry, ['src/index.ts', 'src/shapes.ts'], 'entryConfig should pass through an array entry as-is')
assert.equal(entry.dts, true, 'entryConfig should default dts to true')
assert.equal('clean' in entry, false, 'entryConfig should NOT default clean — only the first entry in a multi-entry array should clean')
console.log('entryConfig(): OK')

const cli = cliConfig('src/cli.ts')
assert.deepEqual(cli.entry, ['src/cli.ts'], 'cliConfig should wrap a string entry in an array')
assert.deepEqual(cli.format, ['esm'], 'cliConfig should default format to esm-only')
assert.deepEqual(cli.banner, { js: '#!/usr/bin/env node' }, 'cliConfig should default a Node shebang banner')
assert.equal('dts' in cli, false, 'cliConfig should NOT default dts — bin entries have no declarations')
console.log('cliConfig(): OK')

const resolvedPath = require.resolve('@infinitetoken/tsconfig/tsup')
assert.ok(resolvedPath, 'tsup.cjs should be independently resolvable via the ./tsup subpath')
console.log('./tsup (subpath resolution): OK')
