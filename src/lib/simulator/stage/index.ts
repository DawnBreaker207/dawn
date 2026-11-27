/**
 * Isometric stage engine — public API.
 *
 *   engine.ts    StageEngine: entities, links, step transitions, frame loop
 *   layout.ts    scene footprint, label picks, camera & HUD-card planning
 *   labels.ts    collision-aware link label placement
 *   packets.ts   packet traffic along link routes
 *   gestures.ts  zoom / pan / swipe input
 *   motion.ts    easing, timings, enter/exit presets, tween descriptors
 *   geometry.ts  rect / polygon / polyline math
 *   text.ts      text measurement & label line breaking
 *   color.ts     dark-theme color remapping
 *   camera.ts    planned camera, user zoom / pan, viewBox
 *   renderers.ts stage-side access to the ../draw entity renderers
 *
 * Entity drawing itself lives in ../draw.
 */
export { StageEngine } from './engine';
export { measureTextWidth, measureMultilineText } from './text';
export { hexToHsl, hslToRgb } from './color';
export type { StageScene, EntityProps, LinkSpec, FlowSpec, Cam, Corner } from './types';
