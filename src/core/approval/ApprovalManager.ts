// Approval Manager - Handle approval workflow gates
import { DatabaseClient } from '../../database/client';
import { EventBus } from '../events/EventBus';
import type { ApprovalRequest, ApprovalType, ApprovalContext } from '../../types';

interface ApprovalManagerConfig {
  db: DatabaseClient;
  eventBus: EventBus;
}

export class ApprovalManager {
  private db: DatabaseClient;
  private eventBus: EventBus;
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();
  
  constructor(config: ApprovalManagerConfig) {
    this.db = config.db;
    this.eventBus = config.eventBus;
  }
  
  /**
   * Request approval for a command step
   */
  async requestApproval(
    commandId: string,
    type: ApprovalType,
    context: ApprovalContext
  ): Promise<boolean> {
    const approval: Omit<ApprovalRequest, 'id'> = {
      commandId,
      type,
      context,
      status: 'pending',
      requestedAt: Date.now()
    };
    
    const approvalId = await this.db.createApproval(approval);
    
    // Emit WebSocket event for real-time UI notification
    this.eventBus.publish('approval:requested' as any, {
      approvalId,
      commandId,
      type,
      context
    });
    
    // Wait for approval decision
    return new Promise<boolean>((resolve) => {
      this.pendingApprovals.set(approvalId, resolve);
      
      // Timeout after 30 minutes
      setTimeout(() => {
        if (this.pendingApprovals.has(approvalId)) {
          this.pendingApprovals.delete(approvalId);
          this.handleTimeout(approvalId);
          resolve(false);
        }
      }, 30 * 60 * 1000);
    });
  }
  
  /**
   * Handle approval decision from UI
   */
  async handleApprovalDecision(
    approvalId: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    const pending = this.pendingApprovals.get(approvalId);
    if (!pending) {
      throw new Error(`Approval ${approvalId} not found or already resolved`);
    }
    
    this.pendingApprovals.delete(approvalId);
    
    // Update approval in database
    await this.db.updateApproval(approvalId, {
      status: approved ? 'approved' : 'rejected',
      resolvedAt: Date.now(),
      resolvedBy: 'user', // TODO: track actual user
      reason
    });
    
    // Emit WebSocket event
    this.eventBus.publish('approval:resolved' as any, {
      approvalId,
      approved,
      reason
    });
    
    // Resolve the promise
    pending(approved);
  }
  
  /**
   * Get pending approvals for a command
   */
  async getPendingApprovalsForCommand(commandId: string): Promise<ApprovalRequest[]> {
    const allPending = await this.db.getPendingApprovals();
    return allPending.filter(a => a.commandId === commandId);
  }
  
  /**
   * Get all pending approvals
   */
  async getAllPendingApprovals(): Promise<ApprovalRequest[]> {
    return await this.db.getPendingApprovals();
  }
  
  /**
   * Check if an approval exists and is pending
   */
  async isPending(approvalId: string): Promise<boolean> {
    const approval = await this.db.getApproval(approvalId);
    return approval?.status === 'pending';
  }
  
  /**
   * Handle timeout for pending approval
   */
  private async handleTimeout(approvalId: string): Promise<void> {
    await this.db.updateApproval(approvalId, {
      status: 'expired',
      resolvedAt: Date.now()
    });
    
    this.eventBus.publish('approval:expired' as any, {
      approvalId
    });
  }
  
  /**
   * Cancel a pending approval (e.g., if command is cancelled)
   */
  async cancelApproval(approvalId: string): Promise<void> {
    const pending = this.pendingApprovals.get(approvalId);
    if (pending) {
      this.pendingApprovals.delete(approvalId);
      pending(false);
    }
    
    await this.db.updateApproval(approvalId, {
      status: 'rejected',
      resolvedAt: Date.now(),
      reason: 'Cancelled'
    });
  }
}
