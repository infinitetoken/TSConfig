/* eslint-disable no-console */
const assert = require('node:assert/strict')

const createTsupConfig = require('../tsup.cjs')

assert.equal(typeof createTsupConfig, 'function', 'tsup.cjs should export a bare function')

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

const resolvedPath = require.resolve('@infinitetoken/tsconfig/tsup')
assert.ok(resolvedPath, 'tsup.cjs should be independently resolvable via the ./tsup subpath')
console.log('./tsup (subpath resolution): OK')
