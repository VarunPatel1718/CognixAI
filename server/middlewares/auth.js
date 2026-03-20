import { clerkClient } from "@clerk/express";

// Middleware to check userId and hasPremiumPlan
export const auth = async (req, res, next) => {
  try {
    const authState = req.auth();
    const userId = authState?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const hasFn = authState?.has;
    const hasPremiumPlan = typeof hasFn === "function" ? await hasFn({ plan: "premium" }) : false;

    const user = await clerkClient.users.getUser(userId);

    const existingFreeUsageRaw = user?.privateMetadata?.free_usage;
    const existingFreeUsage =
      typeof existingFreeUsageRaw === "number"
        ? existingFreeUsageRaw
        : Number.parseInt(String(existingFreeUsageRaw ?? "0"), 10) || 0;

    if (hasPremiumPlan) {
      req.free_usage = 0;
    } else {
      req.free_usage = existingFreeUsage;

      if (existingFreeUsageRaw === undefined) {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: { free_usage: 0 },
        });
      }
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free';
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
