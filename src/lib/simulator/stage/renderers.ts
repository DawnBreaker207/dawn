/**
 * Stage-side access to the entity renderers in ../draw.
 */
import { ENTITY_DEFAULTS, ENTITY_RENDERERS, entityCenter, renderPanelCard, type EntityRender, type PanelRender } from '../draw';
import type { EntityProps, Point } from './types';

export type RenderResult = EntityRender;
export type PanelRenderResult = PanelRender;

export const renderEntityMarkup = (ent: EntityProps): RenderResult => ENTITY_RENDERERS[ent.type](ent);

export const renderPanel = (ent: EntityProps): PanelRenderResult => renderPanelCard(ent);

/** World (x, y) center of an entity. */
export const centerOf = (ent: EntityProps): Point => entityCenter(ent);

/** Fills in the per-type default props (size, color…) under the given ones. */
export const withDefaults = (ent: EntityProps): EntityProps => ({ ...ENTITY_DEFAULTS[ent.type], ...ent });
