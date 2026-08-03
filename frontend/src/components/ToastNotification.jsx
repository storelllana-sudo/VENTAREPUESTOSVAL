import React from 'react';

export default function ToastNotification({ toast }) {
  if (!toast.visible) return null;

  const config = {
    error: { bg: 'bg-red-600 border-red-500', icon: '⚠️' },
    info: { bg: 'bg-blue-600 border-blue-500', icon: 'ℹ️' },
    success: { bg: 'bg-green-600 border-green-500', icon: '✅' }
  };

  const current = config[toast.tipo] || config.success;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-3 rounded-md text-white font-bold shadow-2xl transition-all duration-300 border ${current.bg}`}>
      <span>{current.icon}</span>
      <span>{toast.mensaje}</span>
    </div>
  );
}
