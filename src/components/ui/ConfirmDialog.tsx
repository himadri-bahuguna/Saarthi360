import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Modal } from './Modal.tsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', variant = 'danger' }: ConfirmDialogProps) {
  const variantMap = {
    danger: { icon: AlertTriangle, iconClass: 'text-red-600 bg-red-100', btnClass: 'bg-red-600 hover:bg-red-700 text-white' },
    warning: { icon: AlertTriangle, iconClass: 'text-amber-600 bg-amber-100', btnClass: 'bg-amber-600 hover:bg-amber-700 text-white' },
    info: { icon: Info, iconClass: 'text-blue-600 bg-blue-100', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  };
  const { icon: Icon, iconClass, btnClass } = variantMap[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-4">
        <div className={`flex-shrink-0 p-2.5 rounded-full ${iconClass} h-fit`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{message}</p>
          <div className="flex gap-3 mt-5 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${btnClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
