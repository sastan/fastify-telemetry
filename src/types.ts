import { FastifyRequest, FastifyReply } from 'fastify'
import { Telemetry, BoundariesConfig, Labels } from '@carv/telemetry'
import { ProcessOptions } from '@carv/metrics-process'

export interface FastifyTelemetryOptions {
  /**
   * Expose a metrics route (default: `"/metrics"`)
   */
  url?: false | string

  name?: string

  /**
   * App prefix for metrics, if needed
   *
   * @default ''
   * */
  prefix?: string

  labels?: Labels

  /**
   * (default: `60000`)
   */
  interval?: number

  /**
   * Enable default metrics (default: `true`)
   */
  metrics?: boolean | MetricsOptions
}

export interface MetricsOptions {
  /**
   * Enable http metrics (default: `true`)
   */
  http?: boolean | HttpMetricOptions

  /**
   * Enable process metrics (default: `true`)
   */
  process?: boolean | ProcessOptions
}

export interface HttpMetricOptions extends CommonMetricOptions {
  /**
   * (default: `true`)
   */
  concurrentConnections?: boolean | ConcurrentConnectionsOptions

  /**
   * (default: `true`)
   */
  concurrentRequests?: boolean | ConcurrentRequestsOptions

  /**
   * (default: `true`)
   */
  requestDuration?: boolean | RequestDurationOptions
}

export interface CommonMetricOptions {
  telemetry?: Telemetry
  prefix?: string
  name?: string
  description?: string
  labels?: Labels
}

export interface ConcurrentConnectionsOptions extends CommonMetricOptions {
  /**
   * (default: `{ start: 1, count: 7 }` => `[1, 2, 4, 8, 16, 32, 64]`)
   */
  boundaries?: BoundariesConfig
}

export interface ConcurrentRequestsOptions extends CommonMetricOptions {
  /**
   * (default: `{ start: 1, count: 7 }` => `[1, 2, 4, 8, 16, 32, 64]`)
   */
  boundaries?: BoundariesConfig
}

export interface ExtractLabel {
  (request: FastifyRequest, reply: FastifyReply): string
}

export interface ExtractLabels {
  (request: FastifyRequest, reply: FastifyReply): Labels | undefined
}

export interface Skip {
  (request: FastifyRequest, reply: FastifyReply): unknown
}

export interface RequestDurationOptions extends CommonMetricOptions {
  /**
   * (default: `{ start: 0.1, count: 8 }` => `[0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8]`)
   */
  boundaries?: BoundariesConfig

  /**
   * (default: return `request.routerMethod`)
   */
  extractMethod?: boolean | ExtractLabel | 'method' | 'routerMethod'

  /**
   * (default: return `request.routerPath`)
   */
  extractPath?: boolean | ExtractLabel | 'url' | 'routerPath'

  /**
   * (default: return `reply.statusCode` as string)
   */

  extractStatus?: boolean | ExtractLabel | 'grouped'

  /**
   * Create labels for the request (default: `{ method: extractMethod(), path: extractPath(), status: extractStatus() }`).
   */
  extractLabels?: ExtractLabels

  /**
   * Determinses if this request should **not** be tracked (default: return `false`)
   */
  skip?: Skip
}
