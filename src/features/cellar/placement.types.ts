import { DepthPosition } from '../../types';

export type Depth = DepthPosition;

export type CellarSlot = { shelf: number; column_position: number; depth: Depth };

export const slotKey = (s: CellarSlot) => `${s.shelf}:${s.column_position}:${s.depth}`;

export const formatSlot = (s: CellarSlot) =>
  `S${s.shelf} · C${s.column_position} · ${s.depth === 1 ? 'Front' : 'Back'}`;