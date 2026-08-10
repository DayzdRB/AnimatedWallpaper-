// TypeScript 7's side-effect import checks require a declaration for stylesheet imports.
// Vite also declares these via vite/client; this fallback keeps `tsc -b` happy in stricter hosts.
declare module '*.css'
