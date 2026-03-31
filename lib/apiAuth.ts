import { validateApiKey } from './apiKeys'

/** Valida o header x-api-key da requisição */
export async function validateRequest(request: Request): Promise<boolean> {
  const key = request.headers.get('x-api-key')
  if (!key) return false
  return validateApiKey(key)
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: 'Unauthorized', message: 'API key inválida ou ausente.' },
    { status: 401 }
  )
}
