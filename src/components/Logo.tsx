/** The Countersign mark: a plan sheet (two lines) with a signature stroke under it. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--ink)" />
      <path d="M6.5 7.5h11M6.5 11h7" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 17.2c1.3-2.2 2.4-2.6 2.9-1.4.4 1 .1 2.1 1.1 1.6 1-.5 1.6-2.3 2.6-1.9.8.3.5 1.6 1.4 1.5.8-.1 1.4-.9 2.2-1.1.6-.1 1.2.2 1.8.4" stroke="#5fd3bd" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
