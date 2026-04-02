import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { config } from '@carousel-forge/config'

export const redisConnection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
})

export const carouselQueue = new Queue('carousel-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})
