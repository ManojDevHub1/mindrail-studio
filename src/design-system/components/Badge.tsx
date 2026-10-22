/**
 * Semantic Badge UI Primitive.
 */
import React from 'react';
import type { NodeColorToken } from '../../domain/models';
import styles from './Badge.module.css';

export type BadgeVariant = NodeColorToken | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </span>
  );
}
