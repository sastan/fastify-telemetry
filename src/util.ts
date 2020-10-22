import { FastifyReply, FastifyRequest } from 'fastify'

export function extractRouterMethod(request: FastifyRequest) {
  return request.routerMethod
}

export function extractMethod(request: FastifyRequest) {
  return request.method
}

export function extractRouterPath(request: FastifyRequest) {
  return request.routerPath
}

export function extractUrl(request: FastifyRequest) {
  return request.url
}

export function extractStatusCode(_request: FastifyRequest, reply: FastifyReply) {
  return String(reply.statusCode)
}

export function extractGroupedStatusCode(_request: FastifyRequest, reply: FastifyReply) {
  return `${Math.floor(reply.statusCode / 100)}xx`
}
