import React from 'react';
import { Transaction } from '../../types';
import './TransactionList.css';

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'negotiating':
        return '#f59e0b';
      case 'pending':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="transaction-list">
      {transactions.length === 0 ? (
        <div className="transaction-empty">No transactions yet</div>
      ) : (
        <div className="transaction-items">
          {transactions.map((txn) => (
            <div key={txn.id} className="transaction-item">
              <div className="transaction-header">
                <div className="transaction-product">{txn.product}</div>
                <div
                  className="transaction-status"
                  style={{ color: getStatusColor(txn.status) }}
                >
                  {txn.status}
                </div>
              </div>
              <div className="transaction-details">
                <div className="transaction-detail">
                  <span className="detail-label">Buyer:</span>
                  <span className="detail-value">{txn.buyerEmail}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">
                    ${txn.finalPrice?.toFixed(2) || txn.initialPrice.toFixed(2)}
                  </span>
                </div>
                {txn.profit !== undefined && (
                  <div className="transaction-detail">
                    <span className="detail-label">Profit:</span>
                    <span className="detail-value profit">
                      ${txn.profit.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="transaction-detail">
                  <span className="detail-label">Rounds:</span>
                  <span className="detail-value">{txn.negotiationRounds}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;

