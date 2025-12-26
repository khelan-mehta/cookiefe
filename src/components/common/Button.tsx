import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary:
      'bg-[#FD7979] text-white hover:bg-[#E86A6A] focus:ring-[#FD7979] shadow-[0_4px_0_#E05A5A] hover:shadow-[0_6px_0_#E05A5A] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#E05A5A]',
    secondary:
      'bg-[#FFCDC9] text-[#5D4E4E] hover:bg-[#FDACAC] focus:ring-[#FDACAC] shadow-[0_4px_0_#FDACAC] hover:shadow-[0_6px_0_#FDACAC] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#FDACAC]',
    danger:
      'bg-[#E05A5A] text-white hover:bg-[#D04545] focus:ring-[#E05A5A] shadow-[0_4px_0_#C03030] hover:shadow-[0_6px_0_#C03030] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#C03030]',
    ghost:
      'bg-transparent text-[#5D4E4E] hover:bg-[#FEEAC9] focus:ring-[#FDACAC] border-2 border-[#FFCDC9] hover:border-[#FDACAC]',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
