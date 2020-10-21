import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { Telemetry, Labels } from '@carv/telemetry'

declare module 'fastify' {
  interface FastifyInstance {
    telemetry: Telemetry
  }

  interface FastifyRequest {
    telemetry: Telemetry
  }

  interface FastifyReply {
    telemetry: Telemetry
  }
}

export interface FastifyTelemetryOptions {
  url?: false | '/metrics'
  name?: string
  /**
   * App prefix for metrics, if needed
   *
   * @default ''
   * */
  prefix?: string
  labels?: Labels
  interval?: number
}

export default fp(telemetryPlugin, { name: 'telemetry', fastify: '3.x' })

function telemetryPlugin(
  fastify: FastifyInstance,
  {
    url = '/metrics',
    name = 'fastify',
    prefix = '',
    labels,
    interval = 60000,
  }: FastifyTelemetryOptions,
  done: () => void,
) {
  const log = fastify.log.child({ plugin: 'telemetry' })

  const telemetry = new Telemetry({
    name,
    prefix,
    labels,
    interval,
    logger: {
      error: log.error.bind(log),
      warn: log.warn.bind(log),
      info: log.info.bind(log),
      debug: log.trace.bind(log),
    },
  })

  fastify.decorate('telemetry', telemetry)
  fastify.decorateRequest('telemetry', telemetry)
  fastify.decorateReply('telemetry', telemetry)

  fastify.addHook('onReady', async () => {
    await telemetry.ready()
  })

  fastify.addHook('onClose', (_instance, done) => {
    telemetry.shutdown().then(() => done(), done)
  })

  if (url) {
    fastify.get(url, (_request, reply) => {
      reply.send(telemetry.exportMetrics())
    })
  }

  done()
}
