const { defineConfig } = require('tsup')

/**
 * A package that also ships a CLI bin: one library entry (cjs+esm, declarations,
 * cleans dist/ first) plus one CLI entry (esm-only, Node shebang banner, no
 * declarations — nobody imports a bin as a typed library). Returns the full
 * two-entry array; a package with more entries than this (e.g. an extra
 * subpath) can spread it and append its own: `[...createTsupLibCliConfig(), extraEntry]`.
 *
 * @param {string|string[]} [libEntry]
 * @param {string|string[]} [cliEntry]
 * @param {{ lib?: import('tsup').Options, cli?: import('tsup').Options }} [overrides]
 * @returns {import('tsup').Options[]}
 */
function createTsupLibCliConfig(libEntry = 'src/index.ts', cliEntry = 'src/cli.ts', overrides = {}) {
  return defineConfig([
    {
      entry: Array.isArray(libEntry) ? libEntry : [libEntry],
      format: ['cjs', 'esm'],
      dts: true,
      clean: true,
      ...overrides.lib
    },
    {
      entry: Array.isArray(cliEntry) ? cliEntry : [cliEntry],
      format: ['esm'],
      banner: { js: '#!/usr/bin/env node' },
      ...overrides.cli
    }
  ])
}

module.exports = createTsupLibCliConfig
