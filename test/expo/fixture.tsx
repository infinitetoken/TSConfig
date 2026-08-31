// Importing a plain .js file with no .d.ts only resolves because allowJs is
// true — under react-native.json alone (allowJs unset/false) this fails with
// TS7016 ("Could not find a declaration file for module").
import { greeting } from './helper.js'

// Referencing __DEV__ (react-native's own global augmentation), process.env
// (node), and a bare `test` (jest) — none imported — only resolves because
// expo.json's own `types: ["jest", "node", "react-native"]` default is
// actually wired in, not just inherited unset from react-native.json (which
// carries no `types` of its own). With an empty/wrong `types` array, each of
// these fails with TS2304 ("Cannot find name").
test('expo.json types default', () => {
  expect(__DEV__ || process.env.NODE_ENV).toBeDefined()
})

export function Fixture() {
  return <div>{greeting}</div>
}
