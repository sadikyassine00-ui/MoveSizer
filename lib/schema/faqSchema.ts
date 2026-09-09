export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

/**
 * Generates a valid Schema.org FAQPage structured data JSON-LD object.
 * Adheres to Google and Bing Copilot / AI Overview guidelines for rich snippets.
 */
export function generateFaqSchema(questions: FaqItem[]): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.trim(),
      },
    })),
  };
}
