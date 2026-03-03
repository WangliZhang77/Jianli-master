import jwt from 'jsonwebtoken'

const isProduction = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET || 'resume-master-dev-secret-change-in-production'

if (isProduction && !process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set. Set it in .env or environment variables for production.')
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

/** Optional auth: set req.user if valid token, else req.user = null */
export function optionalAuth(req, res, next) {
  const authHeader = req.get('Authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const payload = verifyToken(token)
    req.user = payload ? { id: payload.userId, email: payload.email } : null
  } else {
    req.user = null
  }
  next()
}

/** Require auth: 401 if no valid token */
export function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Please log in' })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' })
  }
  req.user = { id: payload.userId, email: payload.email }
  next()
}
