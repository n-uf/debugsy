/**
 * The site's two skins: light (the default) and dark. The choice lives in localStorage and on
 * <html data-skin>, which the CSS tokens in globals.css read.
 */
export const SKINS = ["light", "dark"] as const;
export type Skin = (typeof SKINS)[number];

export const SKIN_STORAGE_KEY = "debugsy-skin";

/** Runs in <head> before the first paint: applies a saved dark skin so the page never flashes light. */
export const SKIN_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(SKIN_STORAGE_KEY)})==="dark")document.documentElement.dataset.skin="dark"}catch(e){}`;
