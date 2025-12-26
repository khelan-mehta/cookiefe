import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiAlertCircle, FiShoppingBag, FiUser, FiClock, FiHeart, FiShield, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useDistress } from '../../context/DistressContext';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { ROUTES, DISTRESS_STATUS } from '../../utils/constants';
import { formatDateTime } from '../../utils/validators';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeDistress, isLoading } = useDistress();

  useEffect(() => {
    if (activeDistress && activeDistress.status !== DISTRESS_STATUS.PENDING) {
      navigate(ROUTES.TRACKING);
    }
  }, [activeDistress, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader text="Loading..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#FFCDC9] rounded-full flex items-center justify-center border-4 border-white shadow-[0_4px_0_#FDACAC]">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <FiHeart className="h-10 w-10 text-[#FD7979]" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#5D4E4E]">
            Hello, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-[#5D4E4E] opacity-70 mt-1">How can we help today?</p>
        </div>

        {/* Emergency CTA */}
        <Card className="mb-6 bg-[#FD7979] border-[#E05A5A]">
          <CardBody className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-[0_4px_0_#E05A5A]">
              <FiAlertCircle className="h-8 w-8 text-[#FD7979]" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Animal Emergency?</h2>
            <p className="mb-5 text-white opacity-90">Get immediate help from nearby vets</p>
            <Button
              onClick={() => navigate(ROUTES.DISTRESS_CALL)}
              variant="secondary"
              size="lg"
              className="bg-white text-[#FD7979] hover:bg-[#FEEAC9] shadow-[0_4px_0_#E05A5A]"
            >
              Report Emergency
            </Button>
          </CardBody>
        </Card>

        {/* Active Distress Banner */}
        {activeDistress && (
          <Card className="mb-6 border-2 border-[#FDACAC] bg-[#FFCDC9]">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-[0_3px_0_#FDACAC]">
                    <FiClock className="h-5 w-5 text-[#FD7979]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#5D4E4E]">Active Emergency</h3>
                    <p className="text-sm text-[#5D4E4E] opacity-70">
                      Started {formatDateTime(activeDistress.createdAt)}
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate(ROUTES.TRACKING)} size="sm">
                  View Status
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link to={ROUTES.STORE}>
            <Card hoverable className="h-full">
              <CardBody className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiShoppingBag className="h-7 w-7 text-[#FD7979]" />
                </div>
                <h3 className="font-bold text-[#5D4E4E]">Pet Store</h3>
                <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                  Browse medical supplies
                </p>
              </CardBody>
            </Card>
          </Link>

          <Link to={ROUTES.PROFILE}>
            <Card hoverable className="h-full">
              <CardBody className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiUser className="h-7 w-7 text-[#FD7979]" />
                </div>
                <h3 className="font-bold text-[#5D4E4E]">Profile</h3>
                <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                  View history & settings
                </p>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Tips */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                <FiShield className="h-5 w-5 text-[#FD7979]" />
              </div>
              <h3 className="font-bold text-[#5D4E4E]">Tips for Emergencies</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Stay calm and assess the situation safely',
                'Take a clear photo if possible - it helps vets assess',
                "Don't move the animal unless it's in immediate danger",
                'Keep the animal warm and comfortable',
              ].map((tip, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-[#FFF9F0] rounded-xl">
                  <div className="w-6 h-6 bg-[#FFCDC9] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiStar className="h-3 w-3 text-[#FD7979]" />
                  </div>
                  <span className="text-[#5D4E4E] text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};
