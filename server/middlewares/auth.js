import { clerkClient } from "@clerk/express";

// Middleware to check userId and specific feature permissions
export const auth = async (req, res, next) => {
  try {
    const authState = req.auth();
    const userId = authState?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const hasFn = authState?.has;
    const hasPremiumPlan = typeof hasFn === "function" ? await hasFn({ plan: "premium" }) : false;

    // Check for specific feature flags from session claims
    const featureClaims = authState?.sessionClaims?.fea || '';
    const features = featureClaims.split(',').map(f => f.trim().replace('u:', ''));
    
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
    req.features = features; // Add features to request object
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Middleware to check specific feature permission
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.features || !req.features.includes(featureName)) {
      return res.status(403).json({ 
        success: false, 
        message: `Feature '${featureName}' not available in your plan` 
      });
    }
    next();
  };
}
