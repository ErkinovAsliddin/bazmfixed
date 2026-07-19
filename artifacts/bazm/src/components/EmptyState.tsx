import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A friendly, on-brand empty state: a gold-ringed suzani medallion holding a
 * contextual icon, a title, a supportive description, and an optional
 * next-action slot. Replaces blank space and raw "no data" text everywhere.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
  'data-testid': dataTestid,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
  'data-testid'?: string;
}) {
  return (
    <div
      data-testid={dataTestid}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-16 px-6',
        className,
      )}
    >
      {/* Suzani medallion: concentric gold rings around the icon. */}
      <div className="relative mb-5 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent/10 blur-md" />
        <span className="absolute -inset-2 rounded-full border border-dashed border-accent/30" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary/40 via-background to-accent/15 ring-1 ring-accent/25">
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>

      <h3 className="font-serif text-xl font-semibold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
    </div>
  );
}
