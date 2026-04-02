import type { FastifyInstance } from 'fastify'
import { config } from '@carousel-forge/config'
import { db } from '../../db/index.js'
import { users } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '../../middleware/auth.js'

export async function authRoutes(app: FastifyInstance) {
  // Google OAuth: redirect
  app.get('/google', async (_request, reply) => {
    const params = new URLSearchParams({
      client_id: config.auth.googleClientId,
      redirect_uri: `${config.app.apiUrl}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    })
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  // Google OAuth: callback
  app.get('/google/callback', async (request, reply) => {
    const { code, error: oauthError } = request.query as { code?: string; error?: string }

    if (oauthError || !code) {
      app.log.error({ oauthError }, 'Google OAuth error')
      return reply.redirect(`${config.app.frontendUrl}/auth/callback?error=${oauthError ?? 'no_code'}`)
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: config.auth.googleClientId,
          client_secret: config.auth.googleClientSecret,
          redirect_uri: `${config.app.apiUrl}/api/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string }

      if (!tokenData.access_token) {
        app.log.error({ tokenData }, 'Google token exchange failed')
        return reply.redirect(`${config.app.frontendUrl}/auth/callback?error=token_exchange_failed&details=${encodeURIComponent(tokenData.error_description ?? tokenData.error ?? 'unknown')}`)
      }

      // Get user info
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      const googleUser = (await userRes.json()) as {
        id: string
        email: string
        name: string
        picture: string
      }

      if (!googleUser.id) {
        return reply.redirect(`${config.app.frontendUrl}/auth/callback?error=no_user_info`)
      }

      // Upsert user
      let [user] = await db.select().from(users).where(eq(users.googleId, googleUser.id))

      if (!user) {
        ;[user] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            googleId: googleUser.id,
          })
          .returning()
      }

      const jwt = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '7d' })

      return reply.redirect(`${config.app.frontendUrl}/auth/callback?token=${jwt}`)
    } catch (err) {
      app.log.error({ err }, 'Google OAuth callback error')
      return reply.redirect(`${config.app.frontendUrl}/auth/callback?error=server_error`)
    }
  })

  // Figma OAuth: redirect
  app.get('/figma', async (request, reply) => {
    await authMiddleware(request, reply)
    const params = new URLSearchParams({
      client_id: config.figma.clientId,
      redirect_uri: `${config.app.apiUrl}/api/auth/figma/callback`,
      scope: 'files:read,files:write',
      state: request.user.userId,
      response_type: 'code',
    })
    return reply.redirect(`https://www.figma.com/oauth?${params}`)
  })

  // Figma OAuth: callback
  app.get('/figma/callback', async (request, reply) => {
    const { code, state: userId } = request.query as { code: string; state: string }

    const tokenRes = await fetch('https://www.figma.com/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.figma.clientId,
        client_secret: config.figma.clientSecret,
        redirect_uri: `${config.app.apiUrl}/api/auth/figma/callback`,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = (await tokenRes.json()) as {
      access_token: string
      refresh_token: string
    }

    await db
      .update(users)
      .set({
        figmaAccessToken: tokens.access_token,
        figmaRefreshToken: tokens.refresh_token,
      })
      .where(eq(users.id, userId))

    return reply.redirect(`${config.app.frontendUrl}/dashboard?figma=connected`)
  })

  // Get current user
  app.get('/me', { preHandler: authMiddleware }, async (request) => {
    const { userId } = request.user
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) return { success: false, error: 'User not found' }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        carouselsUsed: user.carouselsUsed,
        carouselsLimit: user.carouselsLimit,
        figmaConnected: !!user.figmaAccessToken,
      },
    }
  })
}
