import { useState, useEffect } from 'react';
import { FiSearch, FiPhone, FiShoppingBag, FiTag } from 'react-icons/fi';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { storeService, type Product } from '../../services/store';

export const Store = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await storeService.getAllProducts();
      setProducts(data.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    setIsLoading(true);
    try {
      const data = await storeService.searchProducts(searchQuery);
      setProducts(data.products);
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#FD7979] rounded-full flex items-center justify-center shadow-[0_4px_0_#E05A5A]">
            <FiShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#5D4E4E]">Pet Store</h1>
            <p className="text-[#5D4E4E] opacity-70 text-sm">Browse medical supplies from local vets</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            <FiSearch className="h-5 w-5" />
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader text="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
              <FiShoppingBag className="h-10 w-10 text-[#FDACAC]" />
            </div>
            <p className="text-[#5D4E4E] opacity-70">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product._id}
                hoverable
                onClick={() => setSelectedProduct(product)}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-t-2xl"
                  />
                )}
                <CardBody>
                  <h3 className="font-bold text-[#5D4E4E] line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[#FD7979] font-bold mt-1 text-lg">
                    {formatPrice(product.price)}
                  </p>
                  {product.vetId?.clinicName && (
                    <p className="text-sm text-[#5D4E4E] opacity-70 mt-2 line-clamp-1">
                      By {product.vetId.clinicName}
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct?.name}
          size="lg"
        >
          {selectedProduct && (
            <div>
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-xl mb-4 border-2 border-[#FFCDC9]"
                />
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-[#FD7979]">
                    {formatPrice(selectedProduct.price)}
                  </p>
                  {selectedProduct.category && (
                    <span className="px-3 py-1.5 bg-[#FEEAC9] text-[#5D4E4E] text-sm rounded-full font-medium border-2 border-[#FFCDC9] flex items-center gap-1.5">
                      <FiTag className="h-3.5 w-3.5" />
                      {selectedProduct.category}
                    </span>
                  )}
                </div>

                {selectedProduct.description && (
                  <div className="p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                    <h4 className="font-bold text-[#5D4E4E] mb-2">Description</h4>
                    <p className="text-[#5D4E4E] opacity-80">{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.vetId && (
                  <div className="pt-4 border-t-2 border-[#FEEAC9]">
                    <h4 className="font-bold text-[#5D4E4E] mb-3">Sold by</h4>
                    <div className="flex items-center justify-between p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                      <div>
                        <p className="font-bold text-[#5D4E4E]">
                          {selectedProduct.vetId.clinicName || 'Veterinary Clinic'}
                        </p>
                        {selectedProduct.vetId.clinicAddress && (
                          <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                            {selectedProduct.vetId.clinicAddress}
                          </p>
                        )}
                      </div>
                      <Button variant="secondary" size="sm">
                        <FiPhone className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
