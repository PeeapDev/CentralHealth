"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';

interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Called when the dialog should close */
  onClose: () => void;
  
  /** Dialog content */
  children: React.ReactNode;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Whether to close when clicking outside (default: true) */
  closeOnOutsideClick?: boolean;
  
  /** Whether to close when pressing Escape key (default: true) */
  closeOnEscape?: boolean;
  
  /** Dialog label for accessibility (optional) */
  ariaLabel?: string;
  
  /** Dialog description for accessibility (optional) */
  ariaDescription?: string;
}

/**
 * Dialog/Modal Component
 * 
 * Accessible dialog component with keyboard support.
 */
export function Dialog({
  open,
  onClose,
  children,
  className = '',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  ariaLabel,
  ariaDescription
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open) return;
    
    // Save currently focused element to restore later
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    
    // Focus the dialog
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
    
    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling of body
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Cleanup
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      
      // Restore focus
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [open, onClose, closeOnEscape]);
  
  // Only render the portal if dialog is open
  if (!open) return null;
  
  return createPortal(
    <div 
      className={`${styles.backdrop} ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-description={ariaDescription}
    >
      <div 
        ref={dialogRef}
        className={styles.content}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
