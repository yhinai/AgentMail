import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const clearOldInboxActivity = mutation({
  args: {
    oldInboxEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all activity entries from the old inbox
    const allActivity = await ctx.db.query('emailActivity').collect();

    let deletedCount = 0;

    for (const activity of allActivity) {
      // Delete if from or to contains the old inbox email
      if (
        activity.from.includes(args.oldInboxEmail) ||
        activity.to.includes(args.oldInboxEmail)
      ) {
        await ctx.db.delete(activity._id);
        deletedCount++;
      }
    }

    return {
      message: `Deleted ${deletedCount} activity entries from ${args.oldInboxEmail}`,
      deletedCount,
    };
  },
});
