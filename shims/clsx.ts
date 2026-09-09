/**
 * Stand-in for the `clsx` package, aliased in `vite.config.ts`.
 *
 * The alias exists to keep one class-merging implementation in the bundle, but `cn`
 * exports only named bindings. Real clsx's primary API is its *default* export, and
 * `@tanstack/devtools` uses it that way (`import clsx from "clsx"`), so aliasing
 * straight to `cn` broke `pnpm dev` with "No matching export ... for import default".
 *
 * Re-exporting under both names matches clsx's real surface, so every consumer
 * resolves whichever one it reaches for. `cn`'s `clsx` is byte-identical in output.
 */
export { clsx, clsx as default } from "cn";
