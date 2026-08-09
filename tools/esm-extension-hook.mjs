import { existsSync } from 'node:fs'
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
    const base = new URL(specifier, context.parentURL)
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(new URL(base.href + ext))) return next(specifier + ext, context)
    }
  }
  return next(specifier, context)
}
