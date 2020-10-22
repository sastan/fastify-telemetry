import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { ConcurrentConnectionsOptions } from './types'

export default fp(concurrentConnections, {
  name: 'telemetry/concurrent-connections',
  fastify: '3.x',
})

function concurrentConnections(
  fastify: FastifyInstance,
  {
    telemetry = fastify.telemetry,
    prefix = 'http',
    name = 'concurrent_connections',
    description = 'Number of concurrent connections',
    labels,
    // [1, 2, 4, 8, 16, 32, 64]
    boundaries = { start: 1, count: 7 },
  }: ConcurrentConnectionsOptions,
  done: () => void,
) {
  telemetry.createValueObserver({ prefix, name, description, labels, boundaries }, () => {
    return new Promise((resolve, reject) => {
      fastify.server.getConnections((error, count) => {
        if (error) {
          reject(error)
        } else {
          resolve(count)
        }
      })
    })
  })

  done()
}
