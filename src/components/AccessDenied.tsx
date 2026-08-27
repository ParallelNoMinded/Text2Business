import React from 'react';

interface AccessDeniedProps {
  onGoHome: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onGoHome }) => {
  return (
    <div className="oc-card mx-auto max-w-md p-6 text-center">
      <p className="oc-section-title text-[16px]">Доступ запрещён</p>
      <p className="mt-2 text-[12px] text-[var(--oc-muted)]">
        У вашей роли нет прав на эту страницу. Обратитесь к администратору, если доступ нужен по работе.
      </p>
      <button type="button" className="oc-btn mt-4" onClick={onGoHome}>
        На главную
      </button>
    </div>
  );
};
