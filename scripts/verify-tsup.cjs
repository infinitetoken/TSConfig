/* eslint-disable no-console */
const assert = require('node:assert/strict')

const createTsupConfig = require('../src/tsup/lib.cjs')

assert.equal(typeof createTsupConfig, 'function', 'tsup/lib.cjs should export a bare function')

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

const arrayEntry = createTsupConfig(['src/index.ts', 'src/shapes.ts'])
assert.deepEqual(arrayEntry.entry, ['src/index.ts', 'src/shapes.ts'], 'createTsupConfig should pass through an array entry as-is')
console.log('createTsupConfig(entry[]): OK')

const resolvedPath = require.resolve('@infinitetoken/tsconfig/tsup/lib')
assert.ok(resolvedPath, 'tsup/lib.cjs should be independently resolvable via the ./tsup/lib subpath')
console.log('./tsup/lib (subpath resolution): OK')

const createTsupCliConfig = require('../src/tsup/cli.cjs')
assert.equal(typeof createTsupCliConfig, 'function', 'tsup/cli.cjs should export a bare function')

const cliBase = createTsupCliConfig()
assert.deepEqual(cliBase.entry, ['src/cli.ts'], 'createTsupCliConfig should default entry to src/cli.ts')
assert.deepEqual(cliBase.format, ['esm'], 'createTsupCliConfig should default format to esm-only')
assert.deepEqual(cliBase.banner, { js: '#!/usr/bin/env node' }, 'createTsupCliConfig should default a Node shebang banner')
assert.equal(cliBase.clean, true, 'createTsupCliConfig should default clean to true — it is the only entry, nothing else cleans dist/')
assert.equal('dts' in cliBase, false, 'createTsupCliConfig should NOT default dts — a CLI-only package has no typed API to declare')
console.log('createTsupCliConfig(): OK')

require.resolve('@infinitetoken/tsconfig/tsup/cli')
console.log('./tsup/cli (subpath resolution): OK')

const createTsupLibCliConfig = require('../src/tsup/lib-cli.cjs')
assert.equal(typeof createTsupLibCliConfig, 'function', 'tsup/lib-cli.cjs should export a bare function')

const [libEntry, cliEntry] = createTsupLibCliConfig()
assert.deepEqual(libEntry.entry, ['src/index.ts'], 'createTsupLibCliConfig should default the lib entry to src/index.ts')
assert.deepEqual(libEntry.format, ['cjs', 'esm'], 'createTsupLibCliConfig should default the lib entry format to cjs+esm')
assert.equal(libEntry.dts, true, 'createTsupLibCliConfig should default the lib entry to dts: true')
assert.equal(libEntry.clean, true, 'createTsupLibCliConfig should default the lib entry to clean: true')
assert.deepEqual(cliEntry.entry, ['src/cli.ts'], 'createTsupLibCliConfig should default the cli entry to src/cli.ts')
assert.deepEqual(cliEntry.format, ['esm'], 'createTsupLibCliConfig should default the cli entry format to esm-only')
assert.deepEqual(cliEntry.banner, { js: '#!/usr/bin/env node' }, 'createTsupLibCliConfig should default the cli entry to a Node shebang banner')
assert.equal('dts' in cliEntry, false, 'createTsupLibCliConfig should NOT default dts on the cli entry')
assert.equal('clean' in cliEntry, false, 'createTsupLibCliConfig should NOT default clean on the cli entry — the lib entry (first) already cleans dist/')
console.log('createTsupLibCliConfig(): OK')

const customLibCli = createTsupLibCliConfig('src/main.ts', 'src/bin.ts', { lib: { minify: true }, cli: { format: ['cjs'] } })
assert.deepEqual(customLibCli[0].entry, ['src/main.ts'], 'createTsupLibCliConfig should accept a custom lib entry')
assert.equal(customLibCli[0].minify, true, 'createTsupLibCliConfig lib overrides should merge on top')
assert.deepEqual(customLibCli[1].entry, ['src/bin.ts'], 'createTsupLibCliConfig should accept a custom cli entry')
assert.deepEqual(customLibCli[1].format, ['cjs'], 'createTsupLibCliConfig cli overrides should merge on top (e.g. aligning a cjs-only outlier)')
console.log('createTsupLibCliConfig(libEntry, cliEntry, overrides): OK')

require.resolve('@infinitetoken/tsconfig/tsup/lib-cli')
console.log('./tsup/lib-cli (subpath resolution): OK')
