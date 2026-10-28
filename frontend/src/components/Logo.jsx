export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Westbourne University crest">
      <path d="M6 60V28a26 26 0 0 1 52 0v32z" fill="#0b1b36" />
      <path d="M16 22l7 24 9-17 9 17 7-24" fill="none" stroke="#c8a24a" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
