interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

export const Loader = ({
  size = 'md',
  color = 'text-[#FD7979]',
  fullScreen = false,
  text,
}: LoaderProps) => {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <svg
          className={`animate-spin ${sizes[size]} ${color}`}
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
      </div>
      {text && <p className="text-[#5D4E4E] text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FEEAC9] bg-opacity-90 z-50">
        <div className="bg-white p-8 rounded-2xl border-2 border-[#FFCDC9] shadow-[0_4px_0_#FDACAC]">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#FEEAC9]">
    <div className="bg-white p-8 rounded-2xl border-2 border-[#FFCDC9] shadow-[0_4px_0_#FDACAC]">
      <Loader size="lg" text={text} />
    </div>
  </div>
);

export const InlineLoader = () => (
  <div className="flex items-center justify-center py-4">
    <Loader size="sm" />
  </div>
);
