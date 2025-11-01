// Convex functions for command execution tracking
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record command execution
export const recordCommandExecution = mutation({
  args: {
    commandId: v.string(),
    originalCommand: v.string(),
    parsedCommand: v.object({
      budget: v.number(),
      quantity: v.number(),
      category: v.string(),
      action: v.string(),
      minProfitMargin: v.optional(v.number()),
      platforms: v.optional(v.array(v.string())),
      location: v.optional(v.string()),
    }),
    status: v.string(),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if command already exists
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", `command:${args.commandId}`))
      .first();

    if (existing) {
      // Update existing command
      await ctx.db.patch(existing._id, {
        value: {
          ...existing.value,
          status: args.status,
          progress: args.progress,
          lastUpdated: now
        },
        updatedAt: now
      });
      return existing._id;
    }

    // Create new command record
    const commandRecordId = await ctx.db.insert("config", {
      key: `command:${args.commandId}`,
      value: {
        commandId: args.commandId,
        originalCommand: args.originalCommand,
        parsedCommand: args.parsedCommand,
        status: args.status,
        progress: args.progress,
        createdAt: now,
        lastUpdated: now
      },
      category: "command_execution",
      updatedAt: now
    });

    return commandRecordId;
  },
});

// Get command execution status
export const getCommandExecution = query({
  args: {
    commandId: v.string(),
  },
  handler: async (ctx, args) => {
    const command = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", `command:${args.commandId}`))
      .first();

    return command?.value;
  },
});

// Get all command executions
export const getAllCommandExecutions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const commands = await ctx.db
      .query("config")
      .withIndex("by_category", (q) => q.eq("category", "command_execution"))
      .collect();

    // Sort by lastUpdated descending
    commands.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const results = commands.map(c => c.value);
    
    if (args.limit) {
      return results.slice(0, args.limit);
    }

    return results;
  },
});

