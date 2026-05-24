import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Fallback rendered when the user is not authenticated */
  fallback: ReactNode;
}

/**
 * ProtectedRoute — state-based auth guard (no react-router-dom).
 *
 * Rendering logic:
 *  1. While the auth context is bootstrapping (isLoading) → show a centred spinner.
 *  2. If the user is not authenticated → render the fallback (LoginPage / RegisterPage).
 *  3. If authenticated → render children.
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
