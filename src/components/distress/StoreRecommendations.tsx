import { useState, useEffect } from 'react';
import { FiShoppingBag, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { aiService, type StoreRecommendation } from '../../services/ai';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { ROUTES } from '../../utils/constants';

interface StoreRecommendationsProps {
  description: string;
  severity?: string;
  animalType?: string;
}

export const StoreRecommendations = ({
  description,
  severity,
  animalType,
}: StoreRecommendationsProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [products, setProducts] = useState<StoreRecommendation[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [description, severity, animalType]);

  const loadRecommendations = async () => {
    if (!description) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.getStoreRecommendations(
        description,
        severity,
        animalType
      );
      setProducts(result.recommendations.products);
      setReasoning(result.recommendations.reasoning);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('Unable to load product recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#FEEAC9] border-[#FFCDC9]">
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFCDC9] rounded-full flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-[#FD7979] border-t-transparent rounded-full" />
            </div>
            <div>
              <span className="font-bold text-[#5D4E4E]">Finding helpful products...</span>
              <p className="text-sm text-[#5D4E4E] opacity-70">
                AI is searching for relevant items
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <Card>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between bg-[#FFF9F0] rounded-t-2xl border-b-2 border-[#FEEAC9]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFCDC9] rounded-full flex items-center justify-center">
            <FiShoppingBag className="h-5 w-5 text-[#FD7979]" />
          </div>
          <div className="text-left">
            <span className="font-bold text-[#5D4E4E]">Recommended Products</span>
            <p className="text-xs text-[#5D4E4E] opacity-70">
              {products.length} items that may help
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <FiChevronDown className="h-5 w-5 text-[#5D4E4E]" />
        ) : (
          <FiChevronUp className="h-5 w-5 text-[#5D4E4E]" />
        )}
      </button>

      {!isCollapsed && (
        <CardBody className="space-y-4">
          {reasoning && (
            <p className="text-sm text-[#5D4E4E] bg-[#FFF9F0] p-3 rounded-xl border-2 border-[#FEEAC9]">
              💡 {reasoning}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((product) => (
              <div
                key={product._id}
                className="p-3 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9] hover:border-[#FDACAC] transition-colors"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                )}
                <h4 className="font-medium text-[#5D4E4E] text-sm line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-[#5D4E4E] opacity-70 line-clamp-2 mt-1">
                  {product.description}
                </p>
                <p className="text-sm font-bold text-[#FD7979] mt-2">
                  ₹{product.price}
                </p>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => navigate(ROUTES.STORE)}
          >
            <FiExternalLink className="h-4 w-4 mr-2" />
            View All in Store
          </Button>
        </CardBody>
      )}
    </Card>
  );
};
