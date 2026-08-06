import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import { adminTr } from '../lib/adminTr';

type AdminEntity = 'news' | 'event' | 'project' | 'board' | 'member' | 'generic';

interface AdminSuccessContextValue {
  showSuccess: (message?: string) => void;
  showSuccessFor: (entity: AdminEntity, action?: 'saved' | 'created' | 'updated' | 'deleted' | 'published' | 'unpublished' | 'order') => void;
}

const AdminSuccessContext = createContext<AdminSuccessContextValue | undefined>(undefined);

const entityMessages: Record<AdminEntity, Partial<Record<string, string>>> = {
  news: {
    saved: adminTr.successNewsSaved,
    created: adminTr.successNewsSaved,
    updated: adminTr.successNewsSaved,
    deleted: adminTr.successDeleted,
    published: adminTr.successPublished,
    unpublished: adminTr.successUnpublished,
  },
  event: {
    saved: adminTr.successEventSaved,
    created: adminTr.successEventSaved,
    updated: adminTr.successEventSaved,
    deleted: adminTr.successDeleted,
    published: adminTr.successPublished,
    unpublished: adminTr.successUnpublished,
  },
  project: {
    saved: adminTr.successProjectSaved,
    created: adminTr.successProjectSaved,
    updated: adminTr.successProjectSaved,
    deleted: adminTr.successDeleted,
    published: adminTr.successPublished,
    unpublished: adminTr.successUnpublished,
  },
  board: {
    saved: adminTr.successBoardSaved,
    created: adminTr.successBoardSaved,
    updated: adminTr.successBoardSaved,
    deleted: adminTr.successDeleted,
    order: adminTr.successOrderSaved,
  },
  member: {
    saved: adminTr.successMemberSaved,
    updated: adminTr.successMemberSaved,
  },
  generic: {
    saved: adminTr.successSaved,
    created: adminTr.successCreated,
    updated: adminTr.successUpdated,
    deleted: adminTr.successDeleted,
    published: adminTr.successPublished,
    unpublished: adminTr.successUnpublished,
    order: adminTr.successOrderSaved,
  },
};

export function AdminSuccessProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const showSuccess = useCallback((msg?: string) => {
    toast(msg ?? adminTr.successSaved, 'success');
  }, [toast]);

  const showSuccessFor = useCallback((entity: AdminEntity, action: keyof typeof entityMessages.generic = 'saved') => {
    const message = entityMessages[entity][action] ?? entityMessages.generic[action] ?? adminTr.successSaved;
    toast(message, 'success');
  }, [toast]);

  return (
    <AdminSuccessContext.Provider value={{ showSuccess, showSuccessFor }}>
      {children}
    </AdminSuccessContext.Provider>
  );
}

export function useAdminSuccess() {
  const ctx = useContext(AdminSuccessContext);
  if (!ctx) throw new Error('useAdminSuccess must be used within AdminSuccessProvider');
  return ctx;
}
