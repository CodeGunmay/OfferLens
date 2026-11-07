/** OfferLens mark: two offset lenses reading as overlapping supplier views. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0F2A44" />
      <circle cx="13" cy="16" r="6.2" stroke="#16B8A6" strokeWidth="2" />
      <circle cx="20" cy="16" r="6.2" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="13" cy="16" r="2" fill="#16B8A6" />
    </svg>
  );
}
