import { useEffect } from 'react';

let lockCount = 0;
let savedOverflow = '';

/**
 * Locks body scroll when a modal (or any overlay) is open and restores it on close.
 * Uses a ref counter so multiple modals can be open without unlocking too early.
 * @param {boolean} isActive - When true, scroll is locked; when false, restored (if no other lock).
 */
export function useScrollLock(isActive) {
  useEffect(() => {
    if (!isActive) return;

    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow || '';
    }
    lockCount += 1;
    document.body.style.overflow = 'hidden';

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = savedOverflow;
      }
    };
  }, [isActive]);
}
