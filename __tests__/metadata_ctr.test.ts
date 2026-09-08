import { describe, it, expect } from 'vitest';
import { generateMetadata as generateTruckSizeMetadata, generateStaticParams as getDwellingParams } from '@/app/truck-size/[dwelling]/page';
import { generateMetadata as generateWillItFitMetadata, generateStaticParams as getFitParams } from '@/app/will-it-fit/[slug]/page';
import { generateMetadata as generateDimensionsMetadata, generateStaticParams as getDimParams } from '@/app/dimensions/[slug]/page';

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
});
