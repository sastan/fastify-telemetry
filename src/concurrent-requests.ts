import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { ConcurrentRequestsOptions } from './types'

export default fp(concurrentRequests, { name: 'telemetry/concurrent-requests', fastify: '3.x' })

function concurrentRequests(
  fastify: FastifyInstance,
  {
    telemetry = fastify.telemetry,
    prefix = 'http',
    name = 'concurrent_requests',
    description = 'Number of concurrent requests (measured at request start)',
    labels,
    // [1, 2, 4, 8, 16, 32, 64]
    boundaries = { start: 1, count: 7 },
  }: ConcurrentRequestsOptions,
  done: () => void,
) {
  const metric = telemetry
    .createValueRecorder({ prefix, name, description, labels, boundaries })
    .bind()

  let concurrentRequests = 0

  fastify.addHook('onRequest', (_request, _reply, next) => {
    concurrentRequests = metric.update(concurrentRequests + 1)
    next()
  })

  fastify.addHook('onResponse', (_request, _reply, next) => {
    concurrentRequests -= 1
    next()
  })

  done()
}
