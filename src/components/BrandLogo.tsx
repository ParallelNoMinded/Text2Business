import React from 'react';

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  markClassName = 'h-9 w-9',
  showWordmark = false,
  inverted = false,
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/favicon.svg"
        alt="NeuroBiz"
        className={`${markClassName} object-contain ${inverted ? 'brightness-0 invert' : ''}`}
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={`text-[15px] sm:text-base font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'}`}>
            NeuroBiz
          </span>
          <span className={`text-[10px] sm:text-[11px] font-medium mt-0.5 ${inverted ? 'text-white/70' : 'text-zinc-500'}`}>
            Комплексная автоматизация сервиса
          </span>
        </span>
      )}
    </span>
  );
};
