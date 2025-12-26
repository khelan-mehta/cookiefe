import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 border-[#FFCDC9] shadow-[0_4px_0_#FDACAC] ${
        hoverable
          ? 'hover:shadow-[0_6px_0_#FDACAC] hover:-translate-y-0.5 transition-all cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`px-5 py-4 border-b-2 border-[#FEEAC9] ${className}`}>
    {children}
  </div>
);

export const CardBody = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`p-5 ${className}`}>{children}</div>;

export const CardFooter = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`px-5 py-4 border-t-2 border-[#FEEAC9] bg-[#FFF9F0] rounded-b-2xl ${className}`}>
    {children}
  </div>
);
