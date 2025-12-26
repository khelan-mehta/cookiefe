import { ReactNode, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#5D4E4E] bg-opacity-40 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-2xl w-full ${sizes[size]} transform transition-all border-2 border-[#FFCDC9] shadow-[0_8px_0_#FDACAC]`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-5 border-b-2 border-[#FEEAC9]">
              {title && (
                <h3 className="text-lg font-bold text-[#5D4E4E]">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#FEEAC9] transition-colors border-2 border-transparent hover:border-[#FFCDC9]"
                >
                  <FiX className="h-5 w-5 text-[#5D4E4E]" />
                </button>
              )}
            </div>
          )}

          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-[#5D4E4E] mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-[#5D4E4E] bg-[#FEEAC9] rounded-full hover:bg-[#FFCDC9] transition-all font-semibold border-2 border-[#FFCDC9]"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-5 py-2.5 text-white rounded-full transition-all font-semibold shadow-[0_4px_0] hover:shadow-[0_6px_0] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0] ${
            variant === 'danger'
              ? 'bg-[#E05A5A] shadow-[#C03030] hover:shadow-[#C03030] active:shadow-[#C03030]'
              : 'bg-[#FD7979] shadow-[#E05A5A] hover:shadow-[#E05A5A] active:shadow-[#E05A5A]'
          }`}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
