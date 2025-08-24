import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-250"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
    >
      <div
  className="modal-content rounded-2xl w-full max-w-2xl transform transition-transform duration-250"
  style={{ backgroundColor: 'rgba(10,10,10,0.3)', backdropFilter: 'blur(28px)', border: '1px solid rgba(80,80,80,0.28)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="text-gray-300 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
