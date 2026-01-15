import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FiHeart } from "react-icons/fi";

import { authService } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/constants";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError("Invalid Google response");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.googleAuth({
        idToken: credentialResponse.credential,
      });

      if (response.registered && response.token && response.user) {
        login(response.token, response.user);

        navigate(
          response.user.role === "vet" ? ROUTES.VET_DASHBOARD : ROUTES.DASHBOARD
        );
      } else if (response.tempData) {
        navigate(ROUTES.ROLE_SELECT, {
          state: { tempData: response.tempData },
        });
      }
    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEEAC9] px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center flex flex-col  justify-center mb-8">
          <img
            src={`https://direct-upload-s3-khelan.s3.eu-north-1.amazonaws.com/product-images/271dde41-7721-4fc5-a958-e3cb89619533.jpeg`}
            alt="Cookie logo"
            className="h-48 w-48 self-center rounded-full object-cover  border-[white] border-4 shadow-xl"
          />
          <h1 className="text-3xl mt-6 mb-3 text-[#E3735B] font-bold">Cookie</h1>
          <p>Because Every Life Deserves a Life</p>

        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border-2 border-[#FFCDC9] shadow-[0_8px_0_#FDACAC] p-8">
          <h2 className="text-xl font-bold text-[#5D4E4E] text-center mb-6">
            Welcome
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-[#E05A5A] rounded-xl border-2 border-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setError("Google sign-in failed. Please try again.")
              }
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          {isLoading && (
            <p className="mt-4 text-center text-sm text-[#5D4E4E] opacity-70">
              Signing you in...
            </p>
          )}

          <p className="mt-6 text-center text-sm text-[#5D4E4E] opacity-70">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[#5D4E4E] opacity-80">
            Animal emergency? Help is just a tap away.
          </p>
        </div>
      </div>
    </div>
  );
};
