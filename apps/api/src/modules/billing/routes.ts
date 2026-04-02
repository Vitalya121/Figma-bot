import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.js'

const PLANS = [
  { id: 'free', name: 'Free', price: 0, carouselsLimit: 3, features: ['5 базовых шаблонов', '3 карусели/мес'] },
  { id: 'pro', name: 'Pro', price: 1900, carouselsLimit: 30, features: ['Все шаблоны', '30 каруселей/мес', 'Brand Kit'] },
  { id: 'agency', name: 'Agency', price: 4900, carouselsLimit: 9999, features: ['Безлимит', '10 Brand Kit', 'Приоритет'] },
]

export async function billingRoutes(app: FastifyInstance) {
  app.get('/plans', async () => {
    return { success: true, data: PLANS }
  })

  app.post('/checkout', { preHandler: authMiddleware }, async (request, reply) => {
    const { planId } = request.body as { planId: string }
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan || plan.id === 'free') {
      return reply.status(400).send({ success: false, error: 'Invalid plan' })
    }

    // TODO: integrate Stripe checkout session creation
    // const session = await stripe.checkout.sessions.create({...})
    return {
      success: true,
      data: { checkoutUrl: `https://checkout.stripe.com/placeholder/${planId}` },
    }
  })

  app.post('/webhook', async (request, reply) => {
    // TODO: verify Stripe webhook signature and handle events
    // - checkout.session.completed -> upgrade plan
    // - customer.subscription.deleted -> downgrade to free
    return reply.status(200).send({ received: true })
  })
}
