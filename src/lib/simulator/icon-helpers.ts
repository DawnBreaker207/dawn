export const attrsToString = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(` `);

export const pathsToSvgElements = (paths?: [string, Record<string, string>][]) =>
  (paths || []).map(([tag, attrs]) => `<${tag} ${attrsToString(attrs)}/>`).join(``);
