import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[#5D4E4E] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD7979] focus:ring-opacity-30 focus:border-[#FD7979] transition-all ${
            error
              ? 'border-[#E05A5A] bg-red-50'
              : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-[#E05A5A] font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-[#5D4E4E] opacity-70">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[#5D4E4E] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD7979] focus:ring-opacity-30 focus:border-[#FD7979] transition-all resize-none ${
            error
              ? 'border-[#E05A5A] bg-red-50'
              : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-[#E05A5A] font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-[#5D4E4E] opacity-70">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
