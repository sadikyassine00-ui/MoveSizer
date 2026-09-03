import { ITEMS } from '../constants/items';

export type DensityLevel = 'minimalist' | 'standard' | 'packrat';

export const DENSITY_MULTIPLIERS: Record<DensityLevel, number> = {
  minimalist: 0.8,
  standard: 1.0,
  packrat: 1.35,
};

export interface BoxCalculationParams {
  bedrooms: number;
  occupants: number;
  density?: DensityLevel;
}

export interface BoxCounts {
  small: number;
  medium: number;
  large: number;
  wardrobe: number;
}

export interface BoxVolumeBreakdown {
  small: number;
  medium: number;
  large: number;
  wardrobe: number;
}

export interface BoxCalculationResult {
  totalBoxes: number;
  formulaTotal: number;
  counts: BoxCounts;
  // Direct access aliases for convenience
  small: number;
  medium: number;
  large: number;
  wardrobe: number;
  individualCuFt: BoxVolumeBreakdown;
  volumeByTypeCuFt: BoxVolumeBreakdown;
  totalBoxVolumeCuFt: number;
  totalBoxWeightLbs: number;
}

export function calculateBoxRequirements({
  bedrooms,
  occupants,
  density = 'standard',
}: BoxCalculationParams): BoxCalculationResult {
  const multiplier = DENSITY_MULTIPLIERS[density] ?? 1.0;
  
  // Base formula: ((Bedrooms * 20) + (Occupants * 10)) * Density Multiplier
  const rawTotal = ((bedrooms * 20) + (occupants * 10)) * multiplier;
  const formulaTotal = Math.round(rawTotal);

  // Distribution into box types:
  // Small: 30%
  // Medium: 45%
  // Large: 15%
  // Wardrobe: Bedrooms * 2 (minimum 2), scaled proportionally with density if packrat
  const small = Math.round(formulaTotal * 0.30);
  const medium = Math.round(formulaTotal * 0.45);
  const large = Math.round(formulaTotal * 0.15);
  
  // Base wardrobe boxes: Bedrooms * 2 (minimum 2)
  const baseWardrobe = Math.max(2, bedrooms * 2);
  const wardrobe = density === 'standard' ? baseWardrobe : Math.round(baseWardrobe * multiplier);

  const smallCuFt = ITEMS.box_small?.volumeCuFt ?? 1.5;
  const mediumCuFt = ITEMS.box_medium?.volumeCuFt ?? 3.0;
  const largeCuFt = ITEMS.box_large?.volumeCuFt ?? 4.5;
  const wardrobeCuFt = ITEMS.box_wardrobe?.volumeCuFt ?? 16.0;

  const smallWeight = ITEMS.box_small?.weightLbs ?? 30;
  const mediumWeight = ITEMS.box_medium?.weightLbs ?? 35;
  const largeWeight = ITEMS.box_large?.weightLbs ?? 40;
  const wardrobeWeight = ITEMS.box_wardrobe?.weightLbs ?? 50;

  const volumeByTypeCuFt: BoxVolumeBreakdown = {
    small: Number((small * smallCuFt).toFixed(1)),
    medium: Number((medium * mediumCuFt).toFixed(1)),
    large: Number((large * largeCuFt).toFixed(1)),
    wardrobe: Number((wardrobe * wardrobeCuFt).toFixed(1)),
  };

  const totalBoxVolumeCuFt = Number(
    (
      volumeByTypeCuFt.small +
      volumeByTypeCuFt.medium +
      volumeByTypeCuFt.large +
      volumeByTypeCuFt.wardrobe
    ).toFixed(1)
  );

  const totalBoxWeightLbs =
    small * smallWeight +
    medium * mediumWeight +
    large * largeWeight +
    wardrobe * wardrobeWeight;

  const counts: BoxCounts = {
    small,
    medium,
    large,
    wardrobe,
  };

  return {
    totalBoxes: formulaTotal,
    formulaTotal,
    counts,
    small,
    medium,
    large,
    wardrobe,
    individualCuFt: {
      small: smallCuFt,
      medium: mediumCuFt,
      large: largeCuFt,
      wardrobe: wardrobeCuFt,
    },
    volumeByTypeCuFt,
    totalBoxVolumeCuFt,
    totalBoxWeightLbs,
  };
}
