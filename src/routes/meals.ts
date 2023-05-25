import { knex } from '@/database'
import { checkSessionIdExists } from '@/middlewares/check-session-id-exists'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/meals',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
      })

      const { name, description } = createMealBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        userId: sessionId,
      })
    },
  )

  app.get(
    '/meals',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals').where({ userId: sessionId }).select()

      return { meals }
    },
  )

  app.get(
    '/meals/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const meals = await knex('meals').where({ userId: sessionId, id }).first()

      return { meals }
    },
  )

  app.put(
    '/meals/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = updateMealParamsSchema.parse(request.params)

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
      })

      const { name, description, onDiet } = updateMealBodySchema.parse(
        request.body,
      )
      const { sessionId } = request.cookies

      await knex('meals').where({ id, userId: sessionId }).update({
        name,
        description,
        updatedAt: new Date().toString(),
        onDiet,
      })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/meals/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      await knex('meals')
        .where({
          id,
          userId: sessionId,
        })
        .delete()

      return reply.status(200).send()
    },
  )

  app.get('/summary', async (request, reply) => {
    const { sessionId } = request.cookies

    const totalOfMeals = await knex('meals')
      .where({ userId: sessionId })
      .count('id', { as: 'total' })

    const mealsOnDiet = await knex('meals')
      .where({
        userId: sessionId,
        onDiet: true,
      })
      .count('onDiet', { as: 'total' })

    const totalOutOfDiet = await knex('meals')
      .where({
        userId: sessionId,
        onDiet: false,
      })
      .count('onDiet', { as: 'total' })

    const meals = await knex('meals')
      .where({ userId: sessionId })
      .orderBy('createdAt', 'desc')
      .select()

    const allMeals = meals.map((meal) => meal.onDiet)

    let count = 0
    const minSequence = 1
    let bestSequence = 0

    for (let i = 0; i < allMeals.length; i++) {
      if (allMeals[i] === true) {
        count++
      }

      if (allMeals[i] === false) {
        if (count >= minSequence && count > bestSequence) {
          bestSequence = count
        }
        count = 0
      }

      if (count >= minSequence && count > bestSequence) {
        bestSequence = count
      }
    }

    return { totalOfMeals, mealsOnDiet, totalOutOfDiet, meals, bestSequence }
  })
}
