import { knex } from '@/database'
import { checkSessionIdExists } from '@/middlewares/check-session-id-exists'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      password,
      sessionId,
    })

    return reply.status(201).send()
  })

  app.get(
    '/users/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getUserByIdSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getUserByIdSchema.parse(request.params)
      const { sessionId } = request.cookies

      const user = await knex('users').where({ id, sessionId }).select()
      console.log(user)

      return { user }
    },
  )
}
