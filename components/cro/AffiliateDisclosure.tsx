import React from 'react';

interface AffiliateDisclosureProps {
  className?: string;
}

/**
 * FTC & Amazon Associates Compliance Disclosure:
 * Must be displayed clearly and conspicuously before the user clicks an affiliate link.
 */
export default function AffiliateDisclosure({
  className = '',
}: AffiliateDisclosureProps) {
  return (
    <p
      className={`text-[11px] text-[#9CA3AF] leading-relaxed ${className}`}
      role="note"
      aria-label="Affiliate Disclosure"
    >
      TruckSizer is supported by our users. When you purchase moving supplies or book labor through our links, we may earn an affiliate commission at no additional cost to you.
    </p>
  );
}
