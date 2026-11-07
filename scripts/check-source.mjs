import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
// Dependency-free integrity lint: fail before deployment on unresolved merge markers.
const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
for (const path of paths) {
  if (!/\.(tsx?|jsx?|mjs|html|css)$/.test(path) || path === 'public/sw.js') continue
  if (/^(<<<<<<< |=======\s*$|>>>>>>> )/m.test(readFileSync(path, 'utf8'))) {
    throw new Error(`Unresolved merge conflict in ${path}`)
  }
}
console.log('Source integrity checks passed')
