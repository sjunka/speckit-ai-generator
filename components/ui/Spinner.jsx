export const Spinner = ({ className = "" }) => (
  <svg
    role="status"
    aria-label="Loading"
    viewBox="0 0 24 24"
    className={`animate-spin ${className}`}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
