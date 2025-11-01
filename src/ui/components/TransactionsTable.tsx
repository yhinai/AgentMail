// @ts-nocheck - TODO: Update for new Transaction schema
import React from 'react';
import type { Transaction, LegacyTransaction } from '../../types';

interface TransactionsTableProps {
  transactions: (Transaction | LegacyTransaction)[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'negotiating':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to check if transaction is LegacyTransaction
  const isLegacyTransaction = (t: Transaction | LegacyTransaction): t is LegacyTransaction => {
    return 'buyerEmail' in t && 'product' in t && 'finalPrice' in t && 'profit' in t;
  };

  // Helper to get display values from either transaction type
  const getDisplayValues = (transaction: Transaction | LegacyTransaction) => {
    if (isLegacyTransaction(transaction)) {
      return {
        product: transaction.product,
        buyer: transaction.buyerEmail,
        price: transaction.finalPrice,
        profit: transaction.profit,
        status: transaction.status
      };
    } else {
      // New Transaction format
      return {
        product: transaction.counterparty?.name || transaction.platform || 'N/A',
        buyer: transaction.counterparty?.email || 'N/A',
        price: transaction.amount,
        profit: transaction.netAmount,
        status: transaction.status
      };
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No transactions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const display = getDisplayValues(transaction);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {display.product}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {display.buyer}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${display.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      ${display.profit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          display.status
                        )}`}
                      >
                        {display.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
