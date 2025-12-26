import { useState, useRef, ChangeEvent } from 'react';
import { FiCamera, FiUpload, FiX, FiImage } from 'react-icons/fi';
import { uploadService } from '../../services/upload';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  onClear?: () => void;
}

export const ImageUpload = ({
  onImageUploaded,
  currentImage,
  onClear,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const compressedFile = await uploadService.compressImage(file);
      const { imageUrl } = await uploadService.uploadDistressImage(compressedFile);
      onImageUploaded(imageUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setPreview(null);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onClear?.();
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-48 object-cover rounded-xl border-2 border-[#FFCDC9]"
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#5D4E4E] bg-opacity-50 rounded-xl">
            <div className="bg-white p-4 rounded-xl">
              <Loader color="text-[#FD7979]" />
            </div>
          </div>
        )}
        {!isUploading && (
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-[#FEEAC9] border-2 border-[#FFCDC9] transition-colors"
          >
            <FiX className="h-5 w-5 text-[#5D4E4E]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="secondary"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <FiCamera className="mr-2 h-5 w-5" />
          Camera
        </Button>

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <FiUpload className="mr-2 h-5 w-5" />
          Upload
        </Button>
      </div>

      {error && <p className="text-sm text-[#E05A5A] font-medium">{error}</p>}

      <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#FFCDC9] rounded-xl bg-[#FFF9F0]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-[#FEEAC9] rounded-full flex items-center justify-center">
            <FiImage className="h-6 w-6 text-[#FDACAC]" />
          </div>
          <p className="text-sm text-[#5D4E4E] font-medium">Take a photo or upload an image</p>
          <p className="text-xs text-[#5D4E4E] opacity-70">(Optional but helps with assessment)</p>
        </div>
      </div>
    </div>
  );
};
