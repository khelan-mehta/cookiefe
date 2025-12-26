import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiHeart } from 'react-icons/fi';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import { isValidPhone } from '../../utils/validators';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

type Role = 'user' | 'vet';

export const RoleSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const tempData = location.state?.tempData;

  const [role, setRole] = useState<Role>('user');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tempData) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        ...tempData,
        phone,
        role,
      });

      login(response.token, response.user);
      navigate(role === 'vet' ? ROUTES.VET_DASHBOARD : ROUTES.DASHBOARD);
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEEAC9] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#FD7979] rounded-full flex items-center justify-center shadow-[0_5px_0_#E05A5A]">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="7" cy="8" r="2"/>
              <circle cx="17" cy="8" r="2"/>
              <circle cx="5" cy="14" r="1.5"/>
              <circle cx="19" cy="14" r="1.5"/>
              <ellipse cx="12" cy="15" rx="4" ry="3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#5D4E4E]">
            Complete Your Profile
          </h1>
          <p className="text-[#5D4E4E] opacity-70 mt-2">
            Welcome, {tempData.name}!
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border-2 border-[#FFCDC9] shadow-[0_8px_0_#FDACAC] p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-[#E05A5A] rounded-xl border-2 border-red-200 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#5D4E4E] mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-5 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    role === 'user'
                      ? 'border-[#FD7979] bg-[#FFCDC9] shadow-[0_4px_0_#FDACAC]'
                      : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    role === 'user' ? 'bg-[#FD7979]' : 'bg-[#FEEAC9]'
                  }`}>
                    <FiUser className={`h-6 w-6 ${role === 'user' ? 'text-white' : 'text-[#FDACAC]'}`} />
                  </div>
                  <span className={`font-bold ${role === 'user' ? 'text-[#5D4E4E]' : 'text-[#5D4E4E]'}`}>
                    Pet Parent
                  </span>
                  <span className="text-xs text-[#5D4E4E] opacity-70">
                    Report emergencies
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('vet')}
                  className={`p-5 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    role === 'vet'
                      ? 'border-[#FD7979] bg-[#FFCDC9] shadow-[0_4px_0_#FDACAC]'
                      : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    role === 'vet' ? 'bg-[#FD7979]' : 'bg-[#FEEAC9]'
                  }`}>
                    <FiHeart className={`h-6 w-6 ${role === 'vet' ? 'text-white' : 'text-[#FDACAC]'}`} />
                  </div>
                  <span className={`font-bold ${role === 'vet' ? 'text-[#5D4E4E]' : 'text-[#5D4E4E]'}`}>
                    Vet / Helper
                  </span>
                  <span className="text-xs text-[#5D4E4E] opacity-70">
                    Respond to calls
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
