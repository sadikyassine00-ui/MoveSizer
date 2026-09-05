import { TruckSpec, TruckId } from '../constants/trucks';
import { ItemDefinition, ItemCategory } from '../constants/items';

export interface DrawableBlock {
  id: string;
  itemId: string;
  label: string;
  x: number;      // inches from front bulkhead (X-axis, 0 to truck.length)
  y: number;      // inches from floor deck (Y-axis, 0 to truck.height)
  z: number;      // inches from left wall (Z-axis, 0 to truck.width)
  length: number; // inches along X
  height: number; // inches along Y
  width: number;  // inches along Z
  color: string;
  category: ItemCategory;
  isAttic: boolean;
  weightLbs: number;
  volumeCuFt: number;
  dimensionsText: string;
  cavityOwnerId?: string;
  stackedOnId?: string;
}

export type PlacedItem = DrawableBlock;

export interface CustomItemInput {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  weightLbs?: number;
  color?: string;
  category?: ItemCategory;
}

export interface UnpackedItem {
  id: string;
  name: string;
  reason: string;
}

export interface PackEngineResult {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
  totalPackedVolumeCuFt: number;
  totalPackedWeightLbs: number;
  truck: TruckSpec;
  winningPass?: HeuristicPass;
  passScores?: Record<HeuristicPass, number>;
}

export interface Bounds {
  length: number;
  width: number;
  height: number;
  hasAttic?: boolean;
  attic?: {
    length: number;
    width: number;
    height: number;
  } | null;
}

export interface SubFurnitureCavity {
  id: string;
  ownerBlockId: string;
  x: number;
  y: number;
  z: number;
  length: number;
  height: number;
  width: number;
}

export interface StackableSurface {
  ownerBlockId?: string;
  x: number;
  z: number;
  length: number;
  width: number;
  y: number;
}

export interface Occupied3D {
  x: number;
  y: number;
  z: number;
  length: number;
  height: number;
  width: number;
  ownerBlockId?: string;
  canStackOn?: boolean;
}

export type HeuristicPass = 'height' | 'footprint' | 'volume';

export interface PassExecutionResult {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
  score: number;
}

export interface ScreenBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  depth: number;
}

export interface RailLayer {
  z: number;
  thickness: number;
  cursorX: number;
}

export type FlatPackingItem = ItemDefinition & { count: number; customId?: string };
