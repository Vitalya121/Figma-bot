import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../utils/errors.js'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string }
    user: { userId: string; email: string }
  }
}
