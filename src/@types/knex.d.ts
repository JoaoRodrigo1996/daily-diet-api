// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      password: string
      sessionId?: string
    }
    meals: {
      id: string
      name: string
      description: string
      createdAt: string
      updatedAt?: string
      onDiet: boolean
      userId?: string
    }
  }
}
