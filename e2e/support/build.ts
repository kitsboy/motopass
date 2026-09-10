import { execSync } from 'node:child_process'

/**
 * Expected BUILD id pattern: `BUILD <YYYY.MM.DD>-<sha7>`.
 *
 * The date part comes from build time (always "today" for a fresh dist), the
 * sha part from HEAD. Deriving it here at test runtime keeps the assertion
 * deterministic and immune to the stale checked-in src/lib/buildInfo.ts
 * (which is regenerated on every build — importing it made this test fail
 * on any day/commit after the last committed regeneration).
 */
export function expectedBuildPattern(): RegExp {
  let sha = ''
  try {
    sha = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim()
  } catch {
    // Non-git checkout — fall back to any 7-hex sha.
  }
  return new RegExp(`BUILD \\d{4}\\.\\d{2}\\.\\d{2}-${sha || '[0-9a-f]{7}'}`)
}
