import { describe, it, expect } from 'vitest';
import { calculateBoxRequirements } from '../lib/engine/boxCalculator';
import { calculateCapacity } from '../lib/engine/capacityEngine';
import {
  packTruck,
  sortBlocksTopological,
  isBlockBehind,
  doScreenBoxesOverlap,
  getBlockScreenBox,
} from '../lib/engine/packEngine';
import { TRUCKS } from '../lib/constants/trucks';
import { ITEMS } from '../lib/constants/items';
import { PRESETS } from '../lib/constants/presets';

describe('Calculation and Packing Engines', () => {
  describe('Task 3: boxCalculator.ts', () => {
    it('asserts a 2-bedroom, 2-occupant home with standard density returns exactly 60 total boxes (18 Small, 27 Medium, 9 Large, 4 Wardrobe)', () => {
      const result = calculateBoxRequirements({
        bedrooms: 2,
        occupants: 2,
        density: 'standard',
      });

      expect(result.totalBoxes).toBe(60);
      expect(result.counts.small).toBe(18);
      expect(result.counts.medium).toBe(27);
      expect(result.counts.large).toBe(9);
      expect(result.counts.wardrobe).toBe(4);

      // Direct property access aliases
      expect(result.small).toBe(18);
      expect(result.medium).toBe(27);
      expect(result.large).toBe(9);
      expect(result.wardrobe).toBe(4);
    });

    it('asserts packrat density (1.35x) scales totals up proportionally without fractional box counts', () => {
      const result = calculateBoxRequirements({
        bedrooms: 2,
        occupants: 2,
        density: 'packrat',
      });

      // ((2 * 20) + (2 * 10)) * 1.35 = 60 * 1.35 = 81
      expect(result.totalBoxes).toBe(81);
      expect(Number.isInteger(result.counts.small)).toBe(true);
      expect(Number.isInteger(result.counts.medium)).toBe(true);
      expect(Number.isInteger(result.counts.large)).toBe(true);
      expect(Number.isInteger(result.counts.wardrobe)).toBe(true);

      // Verify proportional scaling values
      expect(result.counts.small).toBe(24);
      expect(result.counts.medium).toBe(36);
      expect(result.counts.large).toBe(12);
      expect(result.counts.wardrobe).toBe(5);
    });
  });

  describe('Task 3: capacityEngine.ts', () => {
    it('asserts that 330 cu ft of cargo inside a 10-ft truck (402 cu ft total, 329 cu ft usable at 18% buffer) triggers critical (>85%) status', () => {
      const truck10ft = TRUCKS['10ft'];
      const result = calculateCapacity(truck10ft, {
        totalVolumeCuFt: 330,
        totalWeightLbs: 1500,
      });

      // 402 * 0.82 = 329.64 cu ft usable
      expect(result.usableCapacityCuFt).toBeCloseTo(329.6, 1);
      expect(result.fillPercentage).toBeGreaterThan(85);
      expect(result.status).toBe('critical');
      expect(result.needsUpgrade).toBe(true);
      expect(result.nextTruck?.id).toBe('15ft');
    });

    it('asserts that cargo weight exceeding maxPayloadLbs flags a payload overload warning', () => {
      const truck10ft = TRUCKS['10ft']; // maxPayloadLbs: 2810
      const result = calculateCapacity(truck10ft, {
        totalVolumeCuFt: 150,
        totalWeightLbs: 3200, // Exceeds 2810 lbs
      });

      expect(result.isOverweight).toBe(true);
      expect(result.payloadWarning).not.toBeNull();
      expect(result.payloadWarning).toContain('exceeds truck maximum payload');
      expect(result.needsUpgrade).toBe(true);
    });

    it('calculates optimal status when cargo is under 70% usable capacity', () => {
      const truck15ft = TRUCKS['15ft']; // 764 cu ft, usable = 626.5 cu ft
      const result = calculateCapacity(truck15ft, {
        totalVolumeCuFt: 300, // ~47.9%
        totalWeightLbs: 2000,
      });

      expect(result.status).toBe('optimal');
      expect(result.fillPercentage).toBeLessThanOrEqual(70);
      expect(result.isOverweight).toBe(false);
    });
  });

  describe('Task 4: packEngine.ts', () => {
    it('verifies mattresses stand on edge (Z = 0, width = 20″, height = 60″/76″)', () => {
      const truck15ft = TRUCKS['15ft'];
      const result = packTruck(truck15ft, {
        queen_bed: 1,
        king_bed: 1,
      });

      const queenBlock = result.blocks.find((b) => b.itemId === 'queen_bed');
      expect(queenBlock).toBeDefined();
      expect(queenBlock?.z).toBe(0); // Left wall
      expect(queenBlock?.width).toBe(20);
      expect(queenBlock?.height).toBe(60);

      const kingBlock = result.blocks.find((b) => b.itemId === 'king_bed');
      expect(kingBlock).toBeDefined();
      expect(kingBlock?.z).toBe(0); // Left wall
      expect(kingBlock?.width).toBe(20);
      expect(kingBlock?.height).toBe(76);
    });

    it('verifies sofas stand vertically (X = 0, height = 84″)', () => {
      const truck15ft = TRUCKS['15ft']; // height is 86"
      const result = packTruck(truck15ft, {
        sofa_3seat: 1,
      });

      const sofaBlock = result.blocks.find((b) => b.itemId === 'sofa_3seat');
      expect(sofaBlock).toBeDefined();
      expect(sofaBlock?.x).toBe(0); // Front bulkhead
      expect(sofaBlock?.height).toBe(84); // Stood vertically
    });

    it('asserts that no items exceed the ceiling height of the selected truck', () => {
      // 10ft truck height is 74"
      const truck10ft = TRUCKS['10ft'];
      const result = packTruck(truck10ft, {
        sofa_3seat: 1,
        king_bed: 1, // 76" item in 74" truck
        box_large: 10,
      });

      for (const block of result.blocks) {
        expect(block.y + block.height).toBeLessThanOrEqual(truck10ft.height);
      }
    });

    it('packs studio and 1-2 bed presets with valid block geometry', () => {
      const studioPack = packTruck('10ft', PRESETS.studio.items);
      expect(studioPack.blocks.length).toBeGreaterThan(0);

      const bedPack = packTruck('15ft', PRESETS['1-2_bed'].items);
      expect(bedPack.blocks.length).toBeGreaterThan(0);

      // Verify Mom's attic receives wardrobe boxes in 15ft truck
      const atticBlocks = bedPack.blocks.filter((b) => b.isAttic);
      expect(atticBlocks.length).toBeGreaterThan(0);
    });

    it('correctly packs and bounds-checks custom items', () => {
      const truck15ft = TRUCKS['15ft'];
      const customItems = [
        {
          id: 'custom_piano',
          name: 'Upright Piano',
          length: 58,
          width: 24,
          height: 48,
          quantity: 1,
          color: '#8B5CF6',
          category: 'custom' as const,
        },
      ];

      const result = packTruck(truck15ft, {}, customItems);
      const pianoBlock = result.blocks.find((b) => b.itemId === 'custom_piano');
      expect(pianoBlock).toBeDefined();
      expect(pianoBlock?.length).toBe(58);
      expect(pianoBlock?.width).toBe(24);
      expect(pianoBlock?.height).toBe(48);
      expect(pianoBlock?.y).toBe(0); // Floor deck
      expect(pianoBlock!.y + pianoBlock!.height).toBeLessThanOrEqual(truck15ft.height);
    });

    it('handles zero inventory gracefully without errors', () => {
      const truck10ft = TRUCKS['10ft'];
      const result = packTruck(truck10ft, {}, []);
      expect(result.blocks.length).toBe(0);
      expect(result.unpackedItems.length).toBe(0);

      const cap = calculateCapacity(truck10ft, {});
      expect(cap.fillPercentage).toBe(0);
      expect(cap.status).toBe('optimal');
      expect(cap.totalVolumeCuFt).toBe(0);
      expect(cap.totalWeightLbs).toBe(0);
    });

    it('flags unpacked items when cargo dramatically exceeds vehicle capacity', () => {
      const truck10ft = TRUCKS['10ft']; // 402 gross cu ft
      // Load 40 large dressers into a tiny 10ft truck
      const massiveInventory = {
        dresser_6drawer: 40,
      };

      const result = packTruck(truck10ft, massiveInventory, []);
      expect(result.unpackedItems.length).toBeGreaterThan(0);
    });

    it('enforces zero-tolerance flush stacking and bottom-up gravity between stacked boxes', () => {
      const truck15ft = TRUCKS['15ft'];
      // Pack 8 Medium boxes (should create clean 18x18 columns with boxes stacked directly on top of each other)
      const result = packTruck(truck15ft, {
        box_medium: 8,
      });

      expect(result.blocks.length).toBe(8);

      // Find boxes in the first column at (0, 0) or initial (x, z)
      const firstBox = result.blocks[0];
      expect(firstBox.y).toBe(0); // Rests directly on floor deck

      // Find boxes in the same column
      const colBoxes = result.blocks
        .filter((b) => b.x === firstBox.x && b.z === firstBox.z)
        .sort((a, b) => a.y - b.y);

      expect(colBoxes.length).toBeGreaterThan(1);
      for (let i = 1; i < colBoxes.length; i++) {
        const lower = colBoxes[i - 1];
        const upper = colBoxes[i];
        // Upper box sits flush on the top plane of the lower box with ZERO gap
        expect(upper.y).toBe(lower.y + lower.height);
      }
    });

    it('enforces zero-gap adjacent boundary coordinates between neighboring box columns in a tier', () => {
      const truck15ft = TRUCKS['15ft'];
      const result = packTruck(truck15ft, {
        box_medium: 10,
      });

      // Group floor-level boxes (y = 0)
      const floorBoxes = result.blocks
        .filter((b) => b.y === 0)
        .sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));

      expect(floorBoxes.length).toBeGreaterThan(1);
      // Verify adjacent boxes along the Z axis share exact boundary coordinates: Z2 = Z1 + W1
      const sameRowBoxes = floorBoxes.filter((b) => b.x === floorBoxes[0].x);
      if (sameRowBoxes.length >= 2) {
        expect(sameRowBoxes[1].z).toBe(sameRowBoxes[0].z + sameRowBoxes[0].width);
      }
    });

    it('validates that every single catalog item packs safely within bounds across all 4 truck sizes', () => {
      const truckIds: Array<'10ft' | '15ft' | '20ft' | '26ft'> = ['10ft', '15ft', '20ft', '26ft'];
      for (const tid of truckIds) {
        const truck = TRUCKS[tid];
        for (const [itemId, item] of Object.entries(ITEMS)) {
          const res = packTruck(truck, { [itemId]: 1 });
          expect(res.blocks.length).toBe(1);
          const b = res.blocks[0];
          expect(b.y).toBeGreaterThanOrEqual(0);
          expect(b.y + b.height).toBeLessThanOrEqual(truck.height);
          expect(b.x + b.length).toBeLessThanOrEqual(truck.length);
          expect(b.z + b.width).toBeLessThanOrEqual(truck.width);
        }
      }
    });

    it('ensures coffee table in studio preset rests on the floor and snaps to the grid', () => {
      const studioPack = packTruck('10ft', PRESETS.studio.items);
      const coffeeTable = studioPack.blocks.find((b) => b.itemId === 'coffee_table');
      expect(coffeeTable).toBeDefined();
      expect(coffeeTable?.y).toBe(0); // Rests directly on deck
      // Coordinates should snap to clean grid intervals (multiples of 6 or 12)
      expect(coffeeTable!.x % 6).toBe(0);
      expect(coffeeTable!.z % 6).toBe(0);

      // Verify no boxes are stacked on top of coffee table
      const stackedOnCoffeeTable = studioPack.blocks.filter(
        (b) =>
          b.id !== coffeeTable?.id &&
          b.y >= coffeeTable!.height &&
          b.x >= coffeeTable!.x &&
          b.x < coffeeTable!.x + coffeeTable!.length &&
          b.z >= coffeeTable!.z &&
          b.z < coffeeTable!.z + coffeeTable!.width
      );
      expect(stackedOnCoffeeTable.length).toBe(0);
    });

    it('guarantees zero 3D collisions across all dwelling presets', () => {
      for (const [presetId, preset] of Object.entries(PRESETS)) {
        const res = packTruck(preset.defaultTruck, preset.items);
        // Compare cargo hold items among themselves
        const holdBlocks = res.blocks.filter((b) => !b.isAttic);
        for (let i = 0; i < holdBlocks.length; i++) {
          for (let j = i + 1; j < holdBlocks.length; j++) {
            const a = holdBlocks[i];
            const b = holdBlocks[j];
            const overlapX = a.x < b.x + b.length && a.x + a.length > b.x;
            const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
            const overlapZ = a.z < b.z + b.width && a.z + a.width > b.z;
            const isColliding = overlapX && overlapY && overlapZ;
            expect(isColliding).toBe(false);
          }
        }
        // Compare attic shelf items among themselves
        const atticBlocks = res.blocks.filter((b) => b.isAttic);
        for (let i = 0; i < atticBlocks.length; i++) {
          for (let j = i + 1; j < atticBlocks.length; j++) {
            const a = atticBlocks[i];
            const b = atticBlocks[j];
            const overlapX = a.x < b.x + b.length && a.x + a.length > b.x;
            const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
            const overlapZ = a.z < b.z + b.width && a.z + a.width > b.z;
            const isColliding = overlapX && overlapY && overlapZ;
            expect(isColliding).toBe(false);
          }
        }
      }
    });

    it('proves that a coffee table positioned behind a TV stand is sorted BEFORE the TV stand via topological sort', () => {
      const studioPack = packTruck('10ft', PRESETS.studio.items);
      const sorted = sortBlocksTopological(studioPack.blocks);

      const ctIdx = sorted.findIndex((b) => b.itemId === 'coffee_table');
      const tvIdx = sorted.findIndex((b) => b.itemId === 'tv_stand');

      expect(ctIdx).toBeGreaterThanOrEqual(0);
      expect(tvIdx).toBeGreaterThanOrEqual(0);

      // Background coffee table MUST be rendered before foreground TV stand
      expect(ctIdx).toBeLessThan(tvIdx);
    });

    it('guarantees that stacked boxes sit strictly on top of furniture in render order', () => {
      // Create a scenario where boxes sit on a dresser
      const truck = TRUCKS['15ft'];
      const res = packTruck(truck, {
        dresser_6drawer: 1,
        box_medium: 4,
      });

      const sorted = sortBlocksTopological(res.blocks);
      const dresserIdx = sorted.findIndex((b) => b.itemId === 'dresser_6drawer');
      expect(dresserIdx).toBeGreaterThanOrEqual(0);

      const dresser = res.blocks[dresserIdx];
      // All boxes stacked directly on the dresser (y >= dresser.height) must come AFTER dresser in render order
      const stackedBoxes = sorted.filter(
        (b) =>
          b.category === 'boxes' &&
          b.y >= dresser.height &&
          b.x >= dresser.x &&
          b.x < dresser.x + dresser.length &&
          b.z >= dresser.z &&
          b.z < dresser.z + dresser.width
      );

      for (const box of stackedBoxes) {
        const boxIdx = sorted.indexOf(box);
        expect(dresserIdx).toBeLessThan(boxIdx);
      }
    });

    it('verifies 0 topological occlusion violations across all dwelling presets', () => {
      for (const [pId, preset] of Object.entries(PRESETS)) {
        const pack = packTruck(preset.defaultTruck, preset.items);
        const sorted = sortBlocksTopological(pack.blocks);

        // For every pair in sorted order: if item at j is strictly behind item at i, violation!
        for (let i = 0; i < sorted.length; i++) {
          for (let j = i + 1; j < sorted.length; j++) {
            const a = sorted[i];
            const b = sorted[j];
            const sA = getBlockScreenBox(a);
            const sB = getBlockScreenBox(b);

            if (doScreenBoxesOverlap(sA, sB)) {
              const bBehindA = isBlockBehind(b, a);
              const aBehindB = isBlockBehind(a, b);
              // B cannot be strictly behind A if B is rendered after A
              if (bBehindA && !aBehindB) {
                expect.unreachable(
                  `Occlusion violation in ${pId}: ${b.label} (at index ${j}) is strictly behind ${a.label} (at index ${i}) but rendered after!`
                );
              }
            }
          }
        }
      }
    });
  });
});
