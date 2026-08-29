/* eslint-disable no-console */
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const tscBin = require.resolve('typescript/bin/tsc')
const presets = ['base', 'node', 'server', 'react-native']

for (const preset of presets) {
  const tsconfigPath = path.join(__dirname, '..', 'test', preset, 'tsconfig.json')
  execFileSync(process.execPath, [tscBin, '--noEmit', '-p', tsconfigPath], { stdio: 'inherit' })
  console.log(`test/${preset}: OK`)
}
