'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

export function MicrosoftClarity() {
  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (clarityId && typeof window !== 'undefined') {
      Clarity.init(clarityId);
    }
  }, []);

  return null;
}
