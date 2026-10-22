/**
 * Accessible Button UI Primitive.
 * Conforms to docs/DESIGN_SYSTEM.md and docs/ACCESSIBILITY.md.
 */
import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
        {...props}
      >
        {icon && <span className={styles.iconContainer}>{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
