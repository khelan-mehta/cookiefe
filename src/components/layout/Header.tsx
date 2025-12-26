import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiMenu, FiX, FiHome, FiShoppingBag, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const getDashboardRoute = () => {
    return user?.role === 'vet' ? ROUTES.VET_DASHBOARD : ROUTES.DASHBOARD;
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium ${
        isActive(to)
          ? 'bg-[#FD7979] text-white shadow-[0_3px_0_#E05A5A]'
          : 'text-[#5D4E4E] hover:bg-[#FFCDC9] hover:text-[#5D4E4E]'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40">
      {/* Main navbar with cute bubble design */}
      <div className="bg-white  ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with cute paw design */}
            <Link to={getDashboardRoute()} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#FD7979] rounded-full flex items-center justify-center  group-hover:-translate-y-0.5 group-hover:shadow-[0_5px_0_#E05A5A] transition-all">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" opacity="0"/>
                  <circle cx="7" cy="8" r="2"/>
                  <circle cx="17" cy="8" r="2"/>
                  <circle cx="5" cy="14" r="1.5"/>
                  <circle cx="19" cy="14" r="1.5"/>
                  <ellipse cx="12" cy="15" rx="4" ry="3"/>
                </svg>
              </div>
              <span className="font-bold text-xl text-[#5D4E4E] group-hover:text-[#FD7979] transition-colors">
                Cookie
              </span>
            </Link>

            {isAuthenticated && (
              <>
                {/* Desktop Navigation - Pill style */}
                <nav className="hidden md:flex items-center">
                  <div className="flex items-center gap-2 bg-[#FEEAC9] p-1.5 rounded-full">
                    <NavLink to={getDashboardRoute()} icon={FiHome}>
                      Home
                    </NavLink>
                    {user?.role === 'user' && (
                      <NavLink to={ROUTES.STORE} icon={FiShoppingBag}>
                        Store
                      </NavLink>
                    )}
                    {user?.role === 'vet' && (
                      <>
                        <NavLink to={ROUTES.VET_DISTRESS_LIST} icon={FiAlertCircle}>
                          Alerts
                        </NavLink>
                        <NavLink to={ROUTES.VET_STORE} icon={FiPackage}>
                          My Store
                        </NavLink>
                      </>
                    )}
                  </div>
                </nav>

                {/* User section with cute styling */}
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to={ROUTES.PROFILE}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                      isActive(ROUTES.PROFILE)
                        ? 'bg-[#FFCDC9] border-2 border-[#FDACAC]'
                        : 'hover:bg-[#FEEAC9] border-2 border-transparent'
                    }`}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full border-2 border-[#FFCDC9]"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#FDACAC] flex items-center justify-center">
                        <FiUser className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-[#5D4E4E] font-medium text-sm max-w-24 truncate">
                      {user?.name}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-[#5D4E4E] hover:text-white hover:bg-[#FD7979] rounded-full transition-all border-2 border-[#FFCDC9] hover:border-[#FD7979]"
                    title="Logout"
                  >
                    <FiLogOut className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile Menu Button - Cute style */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`md:hidden p-2.5 rounded-full transition-all border-2 ${
                    isMenuOpen
                      ? 'bg-[#FD7979] text-white border-[#FD7979]'
                      : 'text-[#5D4E4E] border-[#FFCDC9] hover:bg-[#FEEAC9]'
                  }`}
                >
                  {isMenuOpen ? (
                    <FiX className="h-5 w-5" />
                  ) : (
                    <FiMenu className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Decorative wave bottom */}
      <div className="relative h-3 bg-transparent overflow-hidden rotate-180">
        <svg className="absolute bottom-0 w-full h-6" viewBox="0 0 1200 24" preserveAspectRatio="none">
          <path
            d="M0,24 C200,0 400,24 600,12 C800,0 1000,24 1200,12 L1200,24 L0,24 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Mobile Menu - Cute card style */}
      {isMenuOpen && isAuthenticated && (
        <div className="md:hidden absolute left-4 right-4 top-20 bg-white rounded-2xl border-2 border-[#FFCDC9] shadow-[0_8px_0_#FDACAC] overflow-hidden animate-slideUp">
          <nav className="p-4 space-y-2">
            <Link
              to={getDashboardRoute()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(getDashboardRoute())
                  ? 'bg-[#FD7979] text-white'
                  : 'text-[#5D4E4E] hover:bg-[#FEEAC9]'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiHome className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            {user?.role === 'user' && (
              <Link
                to={ROUTES.STORE}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(ROUTES.STORE)
                    ? 'bg-[#FD7979] text-white'
                    : 'text-[#5D4E4E] hover:bg-[#FEEAC9]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiShoppingBag className="h-5 w-5" />
                <span className="font-medium">Store</span>
              </Link>
            )}
            {user?.role === 'vet' && (
              <>
                <Link
                  to={ROUTES.VET_DISTRESS_LIST}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(ROUTES.VET_DISTRESS_LIST)
                      ? 'bg-[#FD7979] text-white'
                      : 'text-[#5D4E4E] hover:bg-[#FEEAC9]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiAlertCircle className="h-5 w-5" />
                  <span className="font-medium">Emergencies</span>
                </Link>
                <Link
                  to={ROUTES.VET_STORE}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(ROUTES.VET_STORE)
                      ? 'bg-[#FD7979] text-white'
                      : 'text-[#5D4E4E] hover:bg-[#FEEAC9]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPackage className="h-5 w-5" />
                  <span className="font-medium">My Store</span>
                </Link>
              </>
            )}

            <div className="border-t-2 border-[#FEEAC9] my-3"></div>

            <Link
              to={ROUTES.PROFILE}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(ROUTES.PROFILE)
                  ? 'bg-[#FD7979] text-white'
                  : 'text-[#5D4E4E] hover:bg-[#FEEAC9]'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiUser className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[#E05A5A] hover:bg-red-50 transition-all"
            >
              <FiLogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
