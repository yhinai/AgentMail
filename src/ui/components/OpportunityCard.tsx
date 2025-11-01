import React from 'react';

interface Opportunity {
  id: string;
  title: string;
  price: number;
  marketPrice?: number;
  category: string;
  platform: string;
  url: string;
  images?: string[];
  profitAnalysis?: {
    profitPotential: number;
    profitMargin: number;
    estimatedSalePrice: number;
    platformFees: number;
    netProfit: number;
  };
  profitScore?: number;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect?: (opportunity: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onSelect }: OpportunityCardProps) {
  const expectedProfit = opportunity.profitAnalysis?.netProfit || 0;
  const profitMargin = opportunity.profitAnalysis?.profitMargin || 0;
  const marketPrice = opportunity.marketPrice || opportunity.price * 1.3;

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
        onSelect ? 'hover:border-blue-400' : ''
      }`}
      onClick={() => onSelect?.(opportunity)}
    >
      {/* Image */}
      {opportunity.images && opportunity.images.length > 0 && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={opportunity.images[0]}
            alt={opportunity.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          {opportunity.profitScore && (
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                opportunity.profitScore > 70 ? 'bg-green-600' :
                opportunity.profitScore > 40 ? 'bg-yellow-600' :
                'bg-gray-600'
              }`}>
                Score: {opportunity.profitScore}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
            {opportunity.title}
          </h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
            {opportunity.platform}
          </span>
        </div>

        {/* Pricing */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">List Price:</span>
            <span className="text-lg font-bold text-gray-900">
              ${opportunity.price.toLocaleString()}
            </span>
          </div>
          
          {opportunity.profitAnalysis && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Market Price:</span>
                <span className="text-base font-semibold text-gray-700">
                  ${marketPrice.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-green-700">Expected Profit:</span>
                <span className={`text-lg font-bold ${
                  expectedProfit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${expectedProfit.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Profit Margin:</span>
                <span className={`text-sm font-medium ${
                  profitMargin > 30 ? 'text-green-600' :
                  profitMargin > 15 ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Category */}
        <div className="text-xs text-gray-500 mb-3 capitalize">
          {opportunity.category}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View Listing
          </a>
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opportunity);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

