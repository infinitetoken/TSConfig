// Importing a plain .js file with no .d.ts only resolves because allowJs is
// true — under react-native.json alone (allowJs unset/false) this fails with
// TS7016 ("Could not find a declaration file for module").
import { greeting } from './helper.js'

export function Fixture() {
  return <div>{greeting}</div>
}
