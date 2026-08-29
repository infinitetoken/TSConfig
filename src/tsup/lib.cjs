const { defineConfig } = require('tsup')

/**
 * One library entry point, cjs+esm, with declarations and a clean build.
 * Covers the common case fleet-wide.
 *
 * @param {string|string[]} [entry]
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
function createTsupConfig(entry = 'src/index.ts', overrides = {}) {
  return defineConfig({
    entry: Array.isArray(entry) ? entry : [entry],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    ...overrides
  })
}

module.exports = createTsupConfig
