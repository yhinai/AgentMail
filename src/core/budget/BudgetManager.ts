// Budget Manager - Track and enforce spending limits
import { DatabaseClient } from '../../database/client';
import type { Budget, FlipCommand } from '../../types';

interface BudgetManagerConfig {
  db: DatabaseClient;
}

export class BudgetManager {
  private db: DatabaseClient;
  
  constructor(config: BudgetManagerConfig) {
    this.db = config.db;
  }
  
  /**
   * Create a new budget for a flip command
   */
  async createBudget(commandId: string, totalBudget: number): Promise<Budget> {
    const budget: Omit<Budget, 'id'> = {
      commandId,
      totalBudget,
      spent: 0,
      reserved: 0,
      remaining: totalBudget,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    // Store in database
    const budgetId = await this.db.createBudget(budget);
    
    return {
      ...budget,
      id: budgetId
    };
  }
  
  /**
   * Get budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    return await this.db.getBudget(budgetId);
  }
  
  /**
   * Reserve funds for a pending transaction
   */
  async reserveFunds(budgetId: string, amount: number): Promise<boolean> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    const available = budget.remaining;
    if (amount > available) {
      return false;
    }
    
    // Update budget
    await this.db.updateBudget(budgetId, {
      reserved: budget.reserved + amount,
      remaining: budget.remaining - amount
    });
    
    return true;
  }
  
  /**
   * Release reserved funds (e.g., if transaction is cancelled)
   */
  async releaseFunds(budgetId: string, amount: number): Promise<void> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    const newReserved = Math.max(0, budget.reserved - amount);
    const newRemaining = budget.remaining + amount;
    
    await this.db.updateBudget(budgetId, {
      reserved: newReserved,
      remaining: newRemaining
    });
  }
  
  /**
   * Mark funds as spent (convert reserved to spent)
   */
  async spendFunds(budgetId: string, amount: number): Promise<void> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    // Decrease reserved and increase spent
    await this.db.updateBudget(budgetId, {
      reserved: Math.max(0, budget.reserved - amount),
      spent: budget.spent + amount
    });
    
    // Check if budget is exhausted
    const updatedBudget = await this.getBudget(budgetId);
    if (updatedBudget && updatedBudget.remaining <= 0 && updatedBudget.reserved === 0) {
      await this.db.updateBudget(budgetId, {
        status: 'exhausted'
      });
    }
  }
  
  /**
   * Check if a transaction can be made within budget
   */
  async canAfford(budgetId: string, amount: number): Promise<boolean> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      return false;
    }
    
    return budget.remaining >= amount;
  }
  
  /**
   * Complete a budget (no more spending allowed)
   */
  async completeBudget(budgetId: string): Promise<void> {
    await this.db.updateBudget(budgetId, {
      status: 'completed'
    });
  }
  
  /**
   * Get budget summary
   */
  async getBudgetSummary(budgetId: string): Promise<{
    total: number;
    spent: number;
    reserved: number;
    remaining: number;
    utilizationPercent: number;
  } | null> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      return null;
    }
    
    return {
      total: budget.totalBudget,
      spent: budget.spent,
      reserved: budget.reserved,
      remaining: budget.remaining,
      utilizationPercent: (budget.spent / budget.totalBudget) * 100
    };
  }
}
