import React, { useEffect, useState } from 'react';

/**
 * Lightweight toast notification.
 * Usage: <Toast message="..." type="success|error|info" onDone={() => setToast(null)} />
 */
export default function Toast({ message, type = 'info', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-800',
  };

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-fade-in ${colors[type]}`}
    >
      {type === 'success' && '✓'}
      {type === 'error' && '✕'}
      {message}
    </div>
  );
}
