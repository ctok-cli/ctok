export function CtokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4"  width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.35"/>
      <rect x="2" y="9"  width="11" height="2.5" rx="1.25" fill="currentColor" opacity="0.35"/>
      <rect x="2" y="14" width="17" height="2.5" rx="1.25" fill="currentColor" opacity="0.35"/>
      <rect x="2" y="19" width="9"  height="2.5" rx="1.25" fill="currentColor" opacity="0.35"/>
      <rect x="2" y="24" width="13" height="2.5" rx="1.25" fill="currentColor" opacity="0.35"/>
      <rect x="2" y="14" width="17" height="2.5" rx="1.25" fill="currentColor" opacity="0.7"/>
      <line x1="0" y1="15.25" x2="26" y2="15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="26" cy="15.25" r="2.75" fill="currentColor"/>
      <circle cx="26" cy="15.25" r="1.1" fill="white"/>
    </svg>
  );
}
