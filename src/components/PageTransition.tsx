/**
 * PageTransition — Applies a subtle fade-in animation on route changes.
 * Uses CSS animations with prefers-reduced-motion support.
 */

import { useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function PageTransition({ children }: Props) {
  return (
    <div className="page-transition-container">
      {children}
    </div>
  );
}
