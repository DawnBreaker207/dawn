/** Search engines cut titles at about 60 characters and descriptions at about 160. */
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

/** Shortens a description at a word boundary so the snippet ends cleanly instead of mid-word. */
export function clipDescription(text: string, max = DESCRIPTION_LIMIT): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

/** Pads a very short description so it is worth showing as a snippet. */
export function padDescription(text: string, extra: string, min = 90): string {
  const clean = text.trim();
  if (clean.length >= min) return clean;
  return `${clean}${/[.!?]$/.test(clean) ? ' ' : '. '}${extra}`;
}

/**
 * `<name> · <suffix>` when the page title (with the ` | Site` tail added by the layout) still fits, else just
 * the name.
 */
export function fitTitle(name: string, suffix: string, siteTitle: string): string {
  const tail = ` | ${siteTitle}`.length;
  const withSuffix = `${name} · ${suffix}`;
  return withSuffix.length + tail <= TITLE_LIMIT ? withSuffix : name;
}

/** Title for a lab page. Older titles ended with " · Interactive Visual (Architecture) Lab"; only the name is kept. */
export function labTitle(rawTitle: string, siteTitle: string): string {
  const name = rawTitle.replace(/ · Interactive Visual( Architecture)? Lab$/, '');
  return fitTitle(name, '3D Lab', siteTitle);
}

export function labDescription(text: string): string {
  return padDescription(text, 'Step-by-step interactive 3D simulation.');
}
