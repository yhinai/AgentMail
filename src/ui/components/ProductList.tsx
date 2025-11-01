import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import './ProductList.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="product-list">
        <h2>Products</h2>
        <div className="product-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="product-list">
      <h2>Products</h2>
      {products.length === 0 ? (
        <div className="product-empty">No products in inventory</div>
      ) : (
        <div className="product-items">
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <div className="product-title">{product.title}</div>
              <div className="product-price">${product.price.toFixed(2)}</div>
              <div className="product-meta">
                <span className="product-condition">{product.condition}</span>
                <span className="product-cost">
                  Cost: ${product.cost.toFixed(2)}
                </span>
              </div>
              <div className="product-profit">
                Profit: $
                {((product.price - product.cost) / product.cost) * 100 > 0
                  ? (product.price - product.cost).toFixed(2)
                  : '0.00'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;

