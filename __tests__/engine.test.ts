import { describe, it, expect } from 'vitest';
import { calculateBoxRequirements } from '../lib/engine/boxCalculator';
import { calculateCapacity } from '../lib/engine/capacityEngine';
import {
  packTruck,
  sortBlocksTopological,
  isBlockBehind,
  doScreenBoxesOverlap,
  getBlockScreenBox,
  compactItems,
  calculateLayoutScore,
  isInsideCavity,
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

    it('calculates scalar volume utilization ratio and confirms volumeUtilization <= 1.0 does not exceed usable capacity', () => {
      const truck10ft = TRUCKS['10ft']; // 402 gross, 329.6 usable
      // 2 Queen beds: ~111.2 cu ft
      const result = calculateCapacity(truck10ft, {
        queen_bed: 2,
      });

      expect(result.volumeUtilization).toBeLessThanOrEqual(1.0);
      expect(result.status).toBe('optimal');
      expect(result.needsUpgrade).toBe(false);
    });

    it('verifies Studio preset + 10 boxes in 10ft truck has volumeUtilization <= 0.75 and triggers 0 warnings', () => {
      const truck10ft = TRUCKS['10ft'];
      const inventory = {
        ...PRESETS.studio.items,
        box_medium: (PRESETS.studio.items.box_medium || 0) + 5,
        box_small: (PRESETS.studio.items.box_small || 0) + 5,
      };
      const capResult = calculateCapacity(truck10ft, inventory);
      expect(capResult.volumeUtilization).toBeLessThanOrEqual(0.75);
      expect(capResult.isOverweight).toBe(false);

      const packResult = packTruck(truck10ft, inventory);
      expect(packResult.unpackedItems.length).toBe(0);
      expect(packResult.blocks.length).toBe(41);
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

    it('verifies multiple rail items in small truck utilize parallel sandwiching or right-wall mirroring (e.g. 2 Queen beds in 10ft truck)', () => {
      const truck10ft = TRUCKS['10ft']; // 119" length, 76" width
      const result = packTruck(truck10ft, {
        queen_bed: 2,
      });

      expect(result.unpackedItems.length).toBe(0);
      expect(result.blocks.length).toBe(2);

      const bed1 = result.blocks[0];
      const bed2 = result.blocks[1];

      expect(bed1.itemId).toBe('queen_bed');
      expect(bed2.itemId).toBe('queen_bed');

      // First bed is on left wall (Z = 0)
      expect(bed1.z).toBe(0);
      // Second bed mirrored to right wall (Z = 76 - 20 = 56)
      expect(bed2.z).toBe(56);
      expect(bed1.x).toBe(0);
      expect(bed2.x).toBe(0);
    });

    it('verifies decoupling of 3D placement failure from truck sizing verdict when volume utilization <= 1.0', () => {
      const truck10ft = TRUCKS['10ft'];
      // 3 Queen beds in 10ft truck: ~166.8 cu ft out of 329.6 cu ft usable (50.6% full)
      const cap = calculateCapacity(truck10ft, { queen_bed: 3 });
      const pack = packTruck(truck10ft, { queen_bed: 3 });

      // Sizing math confirms volumetric fit
      expect(cap.volumeUtilization).toBeLessThanOrEqual(1.0);
      expect(cap.status).toBe('optimal');
      expect(cap.needsUpgrade).toBe(false);

      // 3D pack may have coordinate constraints for the 3rd bed, but business verdict does not force upgrade
      expect(pack.blocks.length).toBe(2);
      expect(pack.unpackedItems.length).toBe(1);
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

    it('packs studio preset + 10 standard boxes in a 10ft truck with 0 unpacked items', () => {
      const truck10ft = TRUCKS['10ft'];
      const inventory = {
        ...PRESETS.studio.items,
        box_medium: (PRESETS.studio.items.box_medium || 0) + 5,
        box_small: (PRESETS.studio.items.box_small || 0) + 5,
      };
      const result = packTruck(truck10ft, inventory);
      expect(result.unpackedItems.length).toBe(0);
      expect(result.blocks.length).toBe(41);
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

    it('ensures coffee table in studio preset rests on the floor and compacts flush with zero-gap', () => {
      const studioPack = packTruck('10ft', PRESETS.studio.items);
      const coffeeTable = studioPack.blocks.find((b) => b.itemId === 'coffee_table');
      expect(coffeeTable).toBeDefined();
      expect(coffeeTable?.y).toBe(0); // Rests directly on deck
      // Zero-gap compaction pushes coffee table flush against loveseat (X = 35) and queen bed (Z = 20)
      expect(coffeeTable!.x).toBe(35);
      expect(coffeeTable!.z).toBe(20);

      // Verify boxes are packed on top of coffee table to populate middle cargo volume
      const stackedOnCoffeeTable = studioPack.blocks.filter(
        (b) =>
          b.id !== coffeeTable?.id &&
          b.y >= coffeeTable!.height &&
          b.x >= coffeeTable!.x &&
          b.x < coffeeTable!.x + coffeeTable!.length &&
          b.z >= coffeeTable!.z &&
          b.z < coffeeTable!.z + coffeeTable!.width
      );
      expect(stackedOnCoffeeTable.length).toBeGreaterThan(0);
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
            if (isColliding) {
              const inCavity = isInsideCavity(a, b) || isInsideCavity(b, a);
              if (inCavity) {
                const table = isInsideCavity(a, b) ? a : b;
                const nested = isInsideCavity(a, b) ? b : a;
                // Verify strict containment within cavity bounds
                expect(nested.x).toBeGreaterThanOrEqual(table.x + 2);
                expect(nested.x + nested.length).toBeLessThanOrEqual(table.x + table.length - 2);
                expect(nested.z).toBeGreaterThanOrEqual(table.z + 2);
                expect(nested.z + nested.width).toBeLessThanOrEqual(table.z + table.width - 2);
                expect(nested.y + nested.height).toBeLessThanOrEqual(table.height - 4);
                continue;
              }
            }
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

    describe('Fast Analytic Axis-Projection Compaction (compactItems)', () => {
      const bounds = { length: 240, width: 92, height: 86 };

      it('compresses items along -X to eliminate dead air gaps flush against preceding obstacles', () => {
        const items = [
          {
            id: 'block_1',
            itemId: 'dresser',
            label: 'DRESSER',
            x: 0,
            y: 0,
            z: 0,
            length: 40,
            height: 30,
            width: 30,
            color: '#000',
            category: 'bedroom' as const,
            isAttic: false,
            weightLbs: 100,
            volumeCuFt: 15,
            dimensionsText: '40x30x30',
          },
          {
            id: 'block_2',
            itemId: 'nightstand',
            label: 'NIGHTSTAND',
            x: 70, // 30-inch gap!
            y: 0,
            z: 0,
            length: 20,
            height: 20,
            width: 20,
            color: '#000',
            category: 'bedroom' as const,
            isAttic: false,
            weightLbs: 30,
            volumeCuFt: 4,
            dimensionsText: '20x20x20',
          },
        ];

        const compacted = compactItems(items, bounds);
        const second = compacted.find((b) => b.id === 'block_2')!;
        // Pushed flush against block_1 (x = 0 + 40 = 40)
        expect(second.x).toBe(40);
        expect(second.z).toBe(0);
        expect(second.y).toBe(0);
      });

      it('compresses items along -Z towards the left rail when no obstacle intervenes', () => {
        const items = [
          {
            id: 'block_open',
            itemId: 'box',
            label: 'BOX',
            x: 20,
            y: 0,
            z: 45, // Floating away from left rail
            length: 18,
            height: 16,
            width: 18,
            color: '#000',
            category: 'boxes' as const,
            isAttic: false,
            weightLbs: 30,
            volumeCuFt: 3,
            dimensionsText: '18x16x18',
          },
        ];

        const compacted = compactItems(items, bounds);
        expect(compacted[0].z).toBe(0);
      });

      it('drops items downward via gravity settlement along -Y', () => {
        const items = [
          {
            id: 'box_floating',
            itemId: 'box_medium',
            label: 'BOX',
            x: 0,
            y: 50, // Floating high without support
            z: 0,
            length: 18,
            height: 16,
            width: 18,
            color: '#000',
            category: 'boxes' as const,
            isAttic: false,
            weightLbs: 30,
            volumeCuFt: 3,
            dimensionsText: '18x16x18',
          },
        ];

        const compacted = compactItems(items, bounds);
        // Should drop to deck (y = 0)
        expect(compacted[0].y).toBe(0);
      });

      it('allows items in non-overlapping Z intervals to slide past each other to X = 0', () => {
        const items = [
          {
            id: 'left_item',
            itemId: 'dresser',
            label: 'DRESSER',
            x: 0,
            y: 0,
            z: 0,
            length: 50,
            height: 30,
            width: 30, // Z from 0 to 30
            color: '#000',
            category: 'bedroom' as const,
            isAttic: false,
            weightLbs: 100,
            volumeCuFt: 20,
            dimensionsText: '50x30x30',
          },
          {
            id: 'right_item',
            itemId: 'sofa',
            label: 'SOFA',
            x: 80, // Far back along X
            y: 0,
            z: 40, // Z from 40 to 70 (does NOT overlap left_item along Z)
            length: 35,
            height: 35,
            width: 30,
            color: '#000',
            category: 'living_room' as const,
            isAttic: false,
            weightLbs: 100,
            volumeCuFt: 20,
            dimensionsText: '35x35x30',
          },
        ];

        const compacted = compactItems(items, bounds);
        const rightItem = compacted.find((b) => b.id === 'right_item')!;
        // Since intervals do not overlap in Z, it compresses all the way to front cab X = 0!
        expect(rightItem.x).toBe(0);
      });
    });

    describe('Multi-Pass Heuristic Race & Scoring Engine', () => {
      it('calculates layout score correctly maximizing placed items and penalizing occupied length', () => {
        const truckW = 92;
        const truckH = 86;
        const score1 = calculateLayoutScore(50, 100, truckW, truckH);
        const expected1 = 50 * 10000 - 100 * 92 * 86;
        expect(score1).toBe(expected1);

        // A layout placing more items in shorter length achieves a strictly higher score
        const scoreBetter = calculateLayoutScore(52, 90, truckW, truckH);
        expect(scoreBetter).toBeGreaterThan(score1);
      });

      it('executes the 3-pass heuristic race and returns winning pass and pass scores', () => {
        const res = packTruck('15ft', PRESETS['1-2_bed'].items);
        expect(res.winningPass).toBeDefined();
        expect(['height', 'footprint', 'volume']).toContain(res.winningPass);
        expect(res.passScores).toBeDefined();
        expect(typeof res.passScores!.height).toBe('number');
        expect(typeof res.passScores!.footprint).toBe('number');
        expect(typeof res.passScores!.volume).toBe('number');
      });

      it('executes multi-pass packTruck in under 10ms', () => {
        // Warmup
        packTruck('15ft', PRESETS['1-2_bed'].items);

        const start = performance.now();
        const runs = 20;
        for (let i = 0; i < runs; i++) {
          packTruck('15ft', PRESETS['1-2_bed'].items);
        }
        const elapsed = performance.now() - start;
        const avgMs = elapsed / runs;
        expect(avgMs).toBeLessThan(10);
      });
    });

    describe('Cavity Registration for Tables & Desks', () => {
      it('packs small and medium boxes inside four-legged desk cavities', () => {
        const res = packTruck('15ft', {
          desk: 1,
          box_medium: 4,
          box_small: 4,
        });

        const desk = res.blocks.find((b) => b.itemId === 'desk');
        expect(desk).toBeDefined();

        const cavityBoxes = res.blocks.filter(
          (b) => b.category === 'boxes' && isInsideCavity(desk!, b)
        );

        // Boxes must be packed inside the desk cavity
        expect(cavityBoxes.length).toBeGreaterThan(0);
        for (const box of cavityBoxes) {
          // Verify bounds: x >= desk.x + 2, x + len <= desk.x + desk.length - 2
          expect(box.x).toBeGreaterThanOrEqual(desk!.x + 2);
          expect(box.x + box.length).toBeLessThanOrEqual(desk!.x + desk!.length - 2);
          // Verify bounds: z >= desk.z + 2, z + wid <= desk.z + desk.width - 2
          expect(box.z).toBeGreaterThanOrEqual(desk!.z + 2);
          expect(box.z + box.width).toBeLessThanOrEqual(desk!.z + desk!.width - 2);
          // Verify height clearance: y + height <= desk.height - 4
          expect(box.y + box.height).toBeLessThanOrEqual(desk!.height - 4);
        }
      });

      it('does not register a sub-furniture cavity for low coffee tables', () => {
        const res = packTruck('10ft', {
          coffee_table: 1,
          box_small: 2,
        });

        const coffeeTable = res.blocks.find((b) => b.itemId === 'coffee_table');
        expect(coffeeTable).toBeDefined();

        // No boxes should be nested inside coffee table (it is under 24" height and solid/low)
        const cavityBoxes = res.blocks.filter(
          (b) => b.category === 'boxes' && isInsideCavity(coffeeTable!, b)
        );
        expect(cavityBoxes.length).toBe(0);
      });
    });

    describe('Tailgate Box Anchoring & Continuous Cab-to-Tailgate Packing', () => {
      it('packs boxes continuously from cab to tailgate with 0 disconnected gaps across presets', () => {
        for (const [presetId, preset] of Object.entries(PRESETS)) {
          const res = packTruck(preset.defaultTruck, preset.items);

          // Build continuous X intervals
          const intervals = res.blocks
            .map((b) => ({ start: b.x, end: b.x + b.length }))
            .sort((a, b) => a.start - b.start);

          const merged: Array<{ start: number; end: number }> = [];
          for (const iv of intervals) {
            if (merged.length === 0) {
              merged.push({ ...iv });
            } else {
              const last = merged[merged.length - 1];
              if (iv.start <= last.end) {
                last.end = Math.max(last.end, iv.end);
              } else {
                merged.push({ ...iv });
              }
            }
          }

          // Must have exactly 1 continuous occupied interval (0 gaps / canyons)
          expect(merged.length).toBe(1);
          expect(merged[0].start).toBe(0);
        }
      });

      it('ensures yellow box tiers sit flush against center furniture with no empty canyon at 74.4% load in 10ft truck', () => {
        const truck10ft = TRUCKS['10ft'];
        const inventory = {
          ...PRESETS.studio.items,
          box_medium: (PRESETS.studio.items.box_medium || 0) + 8,
          box_small: (PRESETS.studio.items.box_small || 0) + 6,
        };

        const res = packTruck(truck10ft, inventory);

        // 100% placed
        expect(res.unpackedItems.length).toBe(0);

        // Verify coffee table exists and boxes sit flush behind it
        const coffeeTable = res.blocks.find((b) => b.itemId === 'coffee_table');
        expect(coffeeTable).toBeDefined();
        const coffeeTableEnd = coffeeTable!.x + coffeeTable!.length;

        // Verify there is a box tier starting directly at or right beside the coffee table end
        const adjacentBoxes = res.blocks.filter(
          (b) => b.category === 'boxes' && b.x >= coffeeTableEnd - 2 && b.x <= coffeeTableEnd + 2
        );
        expect(adjacentBoxes.length).toBeGreaterThan(0);

        // Check overall continuous X interval from cab X=0 to tailgate
        const intervals = res.blocks
          .map((b) => ({ start: b.x, end: b.x + b.length }))
          .sort((a, b) => a.start - b.start);

        const merged: Array<{ start: number; end: number }> = [];
        for (const iv of intervals) {
          if (merged.length === 0) {
            merged.push({ ...iv });
          } else {
            const last = merged[merged.length - 1];
            if (iv.start <= last.end) {
              last.end = Math.max(last.end, iv.end);
            } else {
              merged.push({ ...iv });
            }
          }
        }

        expect(merged.length).toBe(1);
        expect(merged[0].start).toBe(0);
        expect(merged[0].end).toBeLessThanOrEqual(truck10ft.length);
        expect(merged[0].end).toBeGreaterThanOrEqual(100);
      });
    });

    describe('Vertical Headroom & Wardrobe Top-Stacking Engine', () => {
      it('allows small boxes to stack on top of wardrobe boxes reaching ceiling height with zero collisions', () => {
        const truck10ft = TRUCKS['10ft']; // Height 74
        const res = packTruck(truck10ft, { box_wardrobe: 4, box_small: 16 });

        expect(res.unpackedItems.length).toBe(0);

        const smallBoxes = res.blocks.filter((b) => b.itemId === 'box_small');
        expect(smallBoxes.length).toBe(16);

        // Small boxes must utilize vertical headroom above wardrobes (y >= 48)
        const stackedOnWardrobe = smallBoxes.filter((b) => b.y >= 48);
        expect(stackedOnWardrobe.length).toBeGreaterThanOrEqual(12);

        // Verify boxes reach ceiling height (y + height = 72 in 74" truck)
        const topCeilingBoxes = smallBoxes.filter((b) => b.y + b.height >= 70);
        expect(topCeilingBoxes.length).toBeGreaterThanOrEqual(6);

        // Zero 3D collisions
        for (let i = 0; i < res.blocks.length; i++) {
          const a = res.blocks[i];
          for (let j = i + 1; j < res.blocks.length; j++) {
            const b = res.blocks[j];
            const xOverlap = Math.max(a.x, b.x) < Math.min(a.x + a.length, b.x + b.length);
            const yOverlap = Math.max(a.y, b.y) < Math.min(a.y + a.height, b.y + b.height);
            const zOverlap = Math.max(a.z, b.z) < Math.min(a.z + a.width, b.z + b.width);
            expect(xOverlap && yOverlap && zOverlap).toBe(false);
          }
        }
      });
    });
  });
});

