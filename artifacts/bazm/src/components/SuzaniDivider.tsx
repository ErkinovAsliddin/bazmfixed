import { cn } from '@/lib/utils';

/**
 * A suzani-inspired section divider: two thin gold rules flanking an
 * eight-pointed star medallion (a motif common to Uzbek embroidery and
 * Islamic geometric art). Decorative only — hidden from assistive tech.
 */
export function SuzaniDivider({
  className,
  tone = 'accent',
}: {
  className?: string;
  tone?: 'accent' | 'muted';
}) {
  const line = tone === 'accent' ? 'via-accent/60' : 'via-border';
  const star = tone === 'accent' ? 'text-accent' : 'text-muted-foreground/50';

  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center justify-center gap-3', className)}
    >
      <span
        className={cn(
          'h-px w-16 bg-gradient-to-r from-transparent to-transparent',
          line,
        )}
      />
      <svg
        viewBox="0 0 24 24"
        className={cn('h-4 w-4 shrink-0', star)}
        fill="currentColor"
      >
        <path d="M12 0l2.4 6.2L21 5l-3.5 5.6L24 12l-6.5 1.4L21 19l-6.6-1.2L12 24l-2.4-6.2L3 19l3.5-5.6L0 12l6.5-1.4L3 5l6.6 1.2z" />
      </svg>
      <span
        className={cn(
          'h-px w-16 bg-gradient-to-l from-transparent to-transparent',
          line,
        )}
      />
    </div>
  );
}
