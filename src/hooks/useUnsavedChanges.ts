import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { adminTr } from '../lib/adminTr';

interface UseUnsavedChangesOptions {
  /** Called after the user confirms leaving (route change). */
  onLeave?: () => void;
}

/**
 * Warns before leaving a page with unsaved form edits (tab close + in-app navigation).
 */
export function useUnsavedChanges(isDirty: boolean, options?: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') setShowDialog(true);
  }, [blocker.state]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const confirmLeave = () => {
    setShowDialog(false);
    options?.onLeave?.();
    if (blocker.state === 'blocked') blocker.proceed();
  };

  const cancelLeave = () => {
    setShowDialog(false);
    if (blocker.state === 'blocked') blocker.reset();
  };

  return {
    showUnsavedDialog: showDialog,
    unsavedMessage: adminTr.confirmUnsavedLeave,
    confirmLeave,
    cancelLeave,
  };
}
