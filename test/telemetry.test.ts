/**
 * @jest-environment node
 */

import { Telemetry } from '@carv/telemetry'
import fastify from 'fastify'

async function build(options?: import('../src').FastifyTelemetryOptions) {
  const app = fastify({
    logger: {
      level: 'warn',
      prettyPrint: true,
    },
  })

  await app.register(import('../src'), options).after()

  const requestsCount = app.telemetry.createCounter({ name: 'requests_count' })

  app.get('/', async function(request, reply) {
    return {
      count: requestsCount.inc(),
      request: request.telemetry instanceof Telemetry,
      reply: reply.telemetry instanceof Telemetry,
    }
  })

  return app
}

test('telemetry', async () => {
  const app = await build()

  let response = await app.inject({
    method: 'GET',
    url: '/',
  })

  expect(response.json()).toMatchObject({
    count: 1,
    request: true,
    reply: true,
  })

  const metrics = await app.telemetry.collect()
  expect(metrics).toMatch('# TYPE requests_count counter')
  expect(metrics).toMatch(/^requests_count 1 \d{13}$/m)

  response = await app.inject({
    method: 'GET',
    url: '/metrics',
  })

  expect(response.payload).toMatch('# TYPE requests_count counter')
  expect(response.payload).toMatch(/^requests_count 1 \d{13}$/m)
})
