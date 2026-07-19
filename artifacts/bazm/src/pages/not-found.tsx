import { Link } from 'wouter';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background suzani-field px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-4 shadow-lg backdrop-blur-sm">
        <EmptyState
          icon={Compass}
          title="404 — Page not found"
          description="This page wandered off. Let's get you back to planning the perfect toy."
          action={
            <Button asChild className="press">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
