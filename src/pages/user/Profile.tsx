import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiClock, FiEdit2, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { userService, type DistressHistory } from '../../services/user';
import { formatDateTime } from '../../utils/validators';
import { isValidPhone } from '../../utils/validators';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<DistressHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await userService.getDistressHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isValidPhone(editData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSaving(true);
    try {
      const { user: updatedUser } = await userService.updateProfile({
        name: editData.name,
        phone: editData.phone,
      });
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-[#D1FAE5] text-[#065F46] border-2 border-[#A7F3D0]';
      case 'cancelled':
        return 'bg-[#FEEAC9] text-[#5D4E4E] border-2 border-[#FFCDC9]';
      default:
        return 'bg-[#FFCDC9] text-[#5D4E4E] border-2 border-[#FDACAC]';
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#5D4E4E] mb-6">Profile</h1>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-20 w-20 rounded-full border-4 border-[#FFCDC9] shadow-[0_4px_0_#FDACAC]"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-[#FFCDC9] flex items-center justify-center border-4 border-white shadow-[0_4px_0_#FDACAC]">
                    <FiUser className="h-10 w-10 text-[#FD7979]" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#5D4E4E]">{user?.name}</h2>
                <div className="flex items-center gap-2 text-[#5D4E4E] opacity-70 mt-2">
                  <FiMail className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2 text-[#5D4E4E] opacity-70 mt-1">
                    <FiPhone className="h-4 w-4" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#FFCDC9] text-[#5D4E4E] text-sm rounded-full font-medium border-2 border-[#FDACAC]">
                  <FiHeart className="h-3.5 w-3.5 text-[#FD7979]" />
                  {user?.role === 'vet' ? 'Vet / Helper' : 'Pet Parent'}
                </span>
              </div>

              <Button variant="ghost" onClick={handleEdit} size="sm">
                <FiEdit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Distress History */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-[#5D4E4E] flex items-center gap-2">
              <FiClock className="h-5 w-5 text-[#FD7979]" />
              Emergency History
            </h3>
          </CardHeader>
          <CardBody>
            {isLoadingHistory ? (
              <div className="py-4 flex justify-center">
                <Loader />
              </div>
            ) : history?.distresses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiClock className="h-8 w-8 text-[#FDACAC]" />
                </div>
                <p className="text-[#5D4E4E] opacity-70">No emergency history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history?.distresses.map((distress) => (
                  <div
                    key={distress._id}
                    className="flex items-start gap-3 p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]"
                  >
                    <div className="p-2 bg-[#FFCDC9] rounded-full">
                      <FiClock className="h-4 w-4 text-[#FD7979]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[#5D4E4E] line-clamp-2 font-medium">
                        {distress.description}
                      </p>
                      <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                        {formatDateTime(distress.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${getStatusStyle(distress.status)}`}
                    >
                      {distress.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          title="Edit Profile"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editData.name}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              label="Phone Number"
              type="tel"
              value={editData.phone}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              placeholder="10-digit phone number"
            />
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
