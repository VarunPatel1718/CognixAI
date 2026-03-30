import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    let authState = null
    
    try {
      authState = typeof req.auth === 'function' 
        ? req.auth() 
        : req.auth
    } catch (e) {
      console.log('Auth state error:', e.message)
    }

    const userId = authState?.userId

    if (!userId) {
      console.log('No userId found in auth state')
      console.log('Auth state:', JSON.stringify(authState))
      console.log('Headers:', req.headers.authorization ? 
        'Bearer token present' : 'No bearer token')
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      })
    }

    let hasPremiumPlan = false
    try {
      const hasFn = authState?.has
      hasPremiumPlan = typeof hasFn === 'function' 
        ? await hasFn({ plan: 'premium' }) 
        : false
    } catch (planError) {
      console.log('Plan check error:', planError.message)
      hasPremiumPlan = false
    }

    let user = null
    try {
      user = await clerkClient.users.getUser(userId)
    } catch (userError) {
      console.log('Get user error:', userError.message)
    }

    const existingFreeUsageRaw = user?.privateMetadata?.free_usage
    const existingFreeUsage = typeof existingFreeUsageRaw === 'number'
      ? existingFreeUsageRaw
      : parseInt(String(existingFreeUsageRaw ?? '0'), 10) || 0

    if (hasPremiumPlan) {
      req.free_usage = 0
    } else {
      req.free_usage = existingFreeUsage
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free'
    req.userId = userId
    next()
    
  } catch (error) {
    console.log('Auth middleware error:', error.message)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}
