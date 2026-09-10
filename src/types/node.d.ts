/**
 * Minimal Node.js module declarations for the repo's source-text regression
 * tests (heroEliteMotion.test.ts). Kept hand-rolled to avoid a dev dependency;
 * extend if tests need more of node:fs / node:path.
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
  export function readFileSync(path: string): Buffer
}
declare module 'node:path' {
  export function resolve(...segments: string[]): string
}

interface ImportMeta {
  readonly dirname: string
}
