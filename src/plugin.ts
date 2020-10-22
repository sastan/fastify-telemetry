import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { Telemetry } from '@carv/telemetry'

import { FastifyTelemetryOptions } from './types'

import httpMetrics from './metrics'

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

export default fp(telemetryPlugin, { name: 'telemetry', fastify: '3.x' })

function telemetryPlugin(
  fastify: FastifyInstance,
  {
    url = '/metrics',
    name = 'fastify',
    prefix = '',
    labels,
    interval = 60000,
    metrics = true,
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

  if (metrics) {
    const { process = true, http = true } = toConfigObject(metrics)

    if (process) {
      telemetry.use(import('@carv/metrics-process'), toConfigObject(process))
    }

    if (http) {
      fastify.register(httpMetrics, toConfigObject(http))
    }
  }

  done()
}

function toConfigObject<T>(config: true | T): Partial<T> {
  return config === true ? {} : config
}
