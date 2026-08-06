import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import ConfirmDialog from '../components/admin/ConfirmDialog';
import { adminTr } from '../lib/adminTr';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextValue {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((msg: string, opts?: ConfirmOptions) => {
    setMessage(msg);
    setOptions(opts ?? {});
    setOpen(true);
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    resolveRef.current(result);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={open}
        message={message}
        title={options.title}
        confirmLabel={options.confirmLabel ?? adminTr.yes}
        cancelLabel={options.cancelLabel ?? adminTr.cancel}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
