import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { HttpMetricOptions, CommonMetricOptions } from './types'

import concurrentConnectionsPlugin from './concurrent-connections'
import concurrentRequestsPlugin from './concurrent-requests'
import requestDurationPlugin from './request-duration'

export default fp(httpMetrics, { name: 'telemetry/http', fastify: '3.x' })

export function httpMetrics(
  fastify: FastifyInstance,
  {
    telemetry = fastify.telemetry,
    prefix = '',
    name = 'http',
    labels,
    concurrentConnections = true,
    concurrentRequests = true,
    requestDuration = true,
  }: HttpMetricOptions,
  done: () => void,
) {
  const namePrefix = telemetry.makeName(prefix, name)

  const mergeOptions = <T extends CommonMetricOptions>(config: true | undefined | T): T => {
    const { prefix, ...options } = !config || config === true ? ({} as T) : config

    return {
      ...options,
      telemetry,
      prefix: telemetry.makeName(namePrefix, prefix),
      labels: { ...labels, ...options.labels },
    } as T
  }

  if (concurrentConnections) {
    fastify.register(concurrentConnectionsPlugin, mergeOptions(concurrentConnections))
  }

  if (concurrentRequests) {
    fastify.register(concurrentRequestsPlugin, mergeOptions(concurrentRequests))
  }

  if (requestDuration) {
    fastify.register(requestDurationPlugin, mergeOptions(requestDuration))
  }

  done()
}
