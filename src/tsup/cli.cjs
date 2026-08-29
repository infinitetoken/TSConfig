const { defineConfig } = require('tsup')

/**
 * A CLI-only package with no separate library export — the bin IS the package
 * (no `dts`: there's no typed API for anyone to import). ESM-only with a Node
 * shebang banner. Modeled on the CLI half of the fleet's package+CLI packages,
 * not on any existing CLI-only package — those still need aligning onto this
 * shape, not the other way around.
 *
 * @param {string|string[]} [entry]
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
function createTsupCliConfig(entry = 'src/cli.ts', overrides = {}) {
  return defineConfig({
    entry: Array.isArray(entry) ? entry : [entry],
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
    clean: true,
    ...overrides
  })
}

module.exports = createTsupCliConfig
