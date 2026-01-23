

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": true
};
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.CueUjkr1.js","_app/immutable/chunks/DTH6BjkA.js","_app/immutable/chunks/C5GrreSL.js","_app/immutable/chunks/BMFMG6kw.js","_app/immutable/chunks/CeAa3Oko.js"];
export const stylesheets = ["_app/immutable/assets/0.DBBBLUy0.css"];
export const fonts = [];
