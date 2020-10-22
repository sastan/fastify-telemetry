import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import * as is from '@carv/is'
import { never, constant } from '@carv/stdlib'
import { millisToSeconds } from '@carv/time'
import { Labels } from '@carv/telemetry'

import { RequestDurationOptions, ExtractLabel, ExtractLabels } from './types'
import * as util from './util'

export default fp(requestDuration, { name: 'telemetry/request-duration', fastify: '3.x' })

function requestDuration(
  fastify: FastifyInstance,
  {
    telemetry = fastify.telemetry,
    prefix = 'http',
    name = 'request_duration_seconds',
    description = 'http request duration in seconds',
    labels,
    // [0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8]
    boundaries = { start: 0.1, count: 8 },
    extractMethod,
    extractPath,
    extractStatus,
    extractLabels = makeExtractLabels({ extractMethod, extractPath, extractStatus }),
    skip = never,
  }: RequestDurationOptions,
  done: () => void,
) {
  const metric = telemetry.createValueRecorder({
    prefix,
    name,
    description,
    labels,
    boundaries,
  })

  fastify.addHook('onResponse', (request, reply, next) => {
    if (!skip(request, reply)) {
      metric.update(millisToSeconds(reply.getResponseTime()), extractLabels(request, reply))
    }

    next()
  })

  done()
}

function makeExtractLabels({
  extractMethod = util.extractRouterMethod,
  extractPath = util.extractRouterPath,
  extractStatus = util.extractStatusCode,
}: {
  extractMethod?: RequestDurationOptions['extractMethod']
  extractPath?: RequestDurationOptions['extractPath']
  extractStatus?: RequestDurationOptions['extractStatus']
}): ExtractLabels {
  const extractors: [string, ExtractLabel][] = []

  if (extractMethod) {
    extractors.push([
      'method',
      is.function(extractMethod)
        ? extractMethod
        : extractMethod === 'method'
        ? util.extractMethod
        : util.extractRouterMethod,
    ])
  }

  if (extractPath) {
    extractors.push([
      'path',
      is.function(extractPath)
        ? extractPath
        : extractPath === 'url'
        ? util.extractUrl
        : util.extractRouterMethod,
    ])
  }

  if (extractStatus) {
    extractors.push([
      'status',
      is.function(extractStatus)
        ? extractStatus
        : extractStatus === 'grouped'
        ? util.extractGroupedStatusCode
        : util.extractStatusCode,
    ])
  }

  if (extractors.length > 0) {
    return (request, reply) => {
      const labels: Labels = {}

      for (const [key, extract] of extractors) {
        labels[key] = extract(request, reply)
      }

      return labels
    }
  }

  return constant(undefined)
}
