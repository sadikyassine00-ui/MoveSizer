import { describe, it, expect } from 'vitest';
import { generateMetadata as generateTruckSizeMetadata, generateStaticParams as getDwellingParams } from '@/app/truck-size/[dwelling]/page';
import { generateMetadata as generateWillItFitMetadata, generateStaticParams as getFitParams } from '@/app/will-it-fit/[slug]/page';
import { generateMetadata as generateDimensionsMetadata, generateStaticParams as getDimParams } from '@/app/dimensions/[slug]/page';
import { generateMetadata as generateCompareMetadata, generateStaticParams as getCompareParams } from '@/app/compare/[slug]/page';
import { generateFaqSchema } from '@/lib/schema/faqSchema';
import { getComparisonSpec, COMPARISON_SPECS } from '@/lib/data/truckComparisons';

describe('High-CTR Programmatic Metadata Validation', () => {
  it('truck-size routes: titles strictly < 60 chars, descriptions < 155 chars, non-WWW canonical', async () => {
    const paramsList = await getDwellingParams();
    expect(paramsList.length).toBeGreaterThan(0);

    for (const { dwelling } of paramsList) {
      const meta = await generateTruckSizeMetadata({ params: Promise.resolve({ dwelling }) });
      const title = String(meta.title);
      const desc = String(meta.description);
      const canonical = typeof meta.alternates?.canonical === 'string' 
        ? meta.alternates.canonical 
        : String(meta.alternates?.canonical);

      expect(title.length).toBeLessThan(60);
      expect(desc.length).toBeLessThan(155);
      expect(title.length).toBeGreaterThan(15);
      expect(desc.length).toBeGreaterThan(50);
      expect(canonical).toContain('https://trucksizer.com/truck-size/');
      expect(canonical).not.toContain('www.trucksizer.com');
    }
  });

  it('will-it-fit routes: titles strictly < 60 chars, descriptions < 155 chars, non-WWW canonical', async () => {
    const paramsList = await getFitParams();
    expect(paramsList.length).toBeGreaterThan(0);

    for (const { slug } of paramsList) {
      const meta = await generateWillItFitMetadata({ params: Promise.resolve({ slug }) });
      const title = String(meta.title);
      const desc = String(meta.description);
      const canonical = typeof meta.alternates?.canonical === 'string' 
        ? meta.alternates.canonical 
        : String(meta.alternates?.canonical);

      expect(title.length).toBeLessThan(60);
      expect(desc.length).toBeLessThan(155);
      expect(title.length).toBeGreaterThan(15);
      expect(desc.length).toBeGreaterThan(50);
      expect(canonical).toContain('https://trucksizer.com/will-it-fit/');
      expect(canonical).not.toContain('www.trucksizer.com');
    }
  });

  it('dimensions routes: titles strictly < 60 chars, descriptions < 155 chars, non-WWW canonical', async () => {
    const paramsList = await getDimParams();
    expect(paramsList.length).toBeGreaterThan(0);

    for (const { slug } of paramsList) {
      const meta = await generateDimensionsMetadata({ params: Promise.resolve({ slug }) });
      const title = String(meta.title);
      const desc = String(meta.description);
      const canonical = typeof meta.alternates?.canonical === 'string' 
        ? meta.alternates.canonical 
        : String(meta.alternates?.canonical);

      expect(title.length).toBeLessThan(60);
      expect(desc.length).toBeLessThan(155);
      expect(title.length).toBeGreaterThan(15);
      expect(desc.length).toBeGreaterThan(50);
      expect(canonical).toContain('https://trucksizer.com/dimensions/');
      expect(canonical).not.toContain('www.trucksizer.com');
    }
  });

  it('compare routes: titles strictly < 60 chars, descriptions < 155 chars, non-WWW canonical', async () => {
    const paramsList = await getCompareParams();
    expect(paramsList.length).toBeGreaterThan(0);

    for (const { slug } of paramsList) {
      const meta = await generateCompareMetadata({ params: Promise.resolve({ slug }) });
      const title = String(meta.title);
      const desc = String(meta.description);
      const canonical = typeof meta.alternates?.canonical === 'string' 
        ? meta.alternates.canonical 
        : String(meta.alternates?.canonical);

      expect(title.length).toBeLessThan(60);
      expect(desc.length).toBeLessThan(155);
      expect(title.length).toBeGreaterThan(15);
      expect(desc.length).toBeGreaterThan(50);
      expect(canonical).toContain('https://trucksizer.com/compare/');
      expect(canonical).not.toContain('www.trucksizer.com');
    }
  });

  it('generateFaqSchema produces valid Schema.org FAQPage structured data', () => {
    const questions = [
      {
        question: 'What are the usable interior dimensions of a 15-Foot box truck?',
        answer: 'The interior cargo deck measures 15\'0" L × 7\'8" W × 7\'2" H.',
      },
      {
        question: 'Does the 15-Foot truck include a Mom\'s Attic cabover deck?',
        answer: 'Yes, it includes a 48 cu ft shelf with a 500 lb weight rating.',
      },
    ];

    const schema = generateFaqSchema(questions);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]['@type']).toBe('Question');
    expect(schema.mainEntity[0].name).toBe(questions[0].question);
    expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(questions[0].answer);
  });

  it('truckComparisons dataset contains full spec parity for key commercial queries', () => {
    // 10ft vs 15ft uhaul parity
    const uhaulSpec = getComparisonSpec('10ft-vs-15ft-uhaul');
    expect(uhaulSpec).not.toBeNull();
    expect(uhaulSpec?.vehicleA.hasMomsAttic).toBe(false);
    expect(uhaulSpec?.vehicleB.hasMomsAttic).toBe(true);
    expect(uhaulSpec?.vehicleA.hasLoadingRamp).toBe(false);
    expect(uhaulSpec?.vehicleB.hasLoadingRamp).toBe(true);

    // 15ft truck brands parity (U-Haul 15 vs Budget 16 vs Penske 16)
    const brandsSpec = getComparisonSpec('15ft-truck-brands');
    expect(brandsSpec).not.toBeNull();
    expect(brandsSpec?.brandMatrix).toBeDefined();
    expect(brandsSpec?.brandMatrix?.length).toBe(3);
    const uhaulRow = brandsSpec?.brandMatrix?.find((r) => r.brand === 'U-Haul');
    const budgetRow = brandsSpec?.brandMatrix?.find((r) => r.brand === 'Budget');
    const penskeRow = brandsSpec?.brandMatrix?.find((r) => r.brand === 'Penske');
    expect(uhaulRow?.deckHeightInches).toBe(29);
    expect(budgetRow?.deckHeightInches).toBe(33);
    expect(penskeRow?.deckHeightInches).toBe(35);
    expect(budgetRow?.sideDoorAvailable).toBe(true);

    // 15ft vs 20ft volume jump parity
    const jumpSpec = getComparisonSpec('15ft-vs-20ft');
    expect(jumpSpec).not.toBeNull();
    expect(jumpSpec?.vehicleB.usableCuFt).toBeGreaterThan(jumpSpec?.vehicleA.usableCuFt || 0);
  });
});

