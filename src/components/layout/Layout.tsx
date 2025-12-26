import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
}

export const Layout = ({
  children,
  showHeader = true,
  className = '',
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#FEEAC9]">
      {showHeader && <Header />}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export const FullScreenLayout = ({ children }: { children: ReactNode }) => {
  return <div className="min-h-screen bg-[#FEEAC9]">{children}</div>;
};
