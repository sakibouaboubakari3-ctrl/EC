const ICONS = {
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  ),
  documents: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
    />
  ),
  hourglass: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 3h12M6 21h12M7 3c0 4.5 4 6 5 6.5m5-6.5c0 4.5-4 6-5 6.5m0 0c1 .5 5 2 5 6.5m-10-6.5c1 .5-1 2-1 6.5m1-6.5c0-4.5-4-6-5-6.5"
    />
  ),
};

export type IconName = keyof typeof ICONS;

export function IconBadge({ icon }: { icon: IconName }) {
  return (
    <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent-deep)]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        {ICONS[icon]}
      </svg>
    </span>
  );
}
