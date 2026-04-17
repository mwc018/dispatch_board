import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'confirm';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  confirm: (message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  confirm: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, type: 'success' }]);
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const error = useCallback((message: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, type: 'error' }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const confirm = useCallback((message: string, onConfirm: () => void) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, {
      id,
      message,
      type: 'confirm',
      onConfirm: () => { onConfirm(); remove(id); },
      onCancel: () => remove(id),
    }]);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ success, error, confirm }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2 z-[100] items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-[13px] font-medium animate-slide-up whitespace-nowrap ${
              t.type === 'success'
                ? 'bg-[#111d13] border-green-500/40 text-green-300'
                : t.type === 'error'
                ? 'bg-[#1d1113] border-red-500/40 text-red-300'
                : 'bg-[#1a1d27] border-[#3a4060] text-slate-200'
            }`}
          >
            {t.type === 'success' && <span className="text-green-400 text-[15px]">✓</span>}
            {t.type === 'error' && <span className="text-red-400 text-[15px]">✕</span>}
            {t.type === 'confirm' && <span className="text-amber-400 text-[15px]">!</span>}
            <span>{t.message}</span>
            {t.type === 'confirm' && (
              <div className="flex gap-1.5 ml-1">
                <button
                  className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 rounded text-[12px] cursor-pointer transition-colors"
                  onClick={t.onConfirm}
                >
                  Yes
                </button>
                <button
                  className="px-3 py-1 bg-[#21253a] border border-[#2a2f45] text-slate-400 hover:bg-[#2a2f45] rounded text-[12px] cursor-pointer transition-colors"
                  onClick={t.onCancel}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
