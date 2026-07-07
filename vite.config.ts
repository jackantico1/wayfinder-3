import { defineConfig, loadEnv, type Plugin } from 'vite'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Runs api/plan-trip.ts's Vercel-style handler in-process during `vite dev`,
// since the plain Vite dev server otherwise has no route for /api/plan-trip.
function planTripDevMiddleware(): Plugin {
  return {
    name: 'plan-trip-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/plan-trip', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString('utf-8')

        let body: unknown;
        try {
          body = raw ? JSON.parse(raw) : undefined
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body', kind: 'bad_request' }))
          return
        }

        const mockRes = {
          status(code: number) {
            res.statusCode = code
            return mockRes
          },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          },
        }

        try {
          const { default: handler } = await server.ssrLoadModule('/api/plan-trip.ts')
          await handler({ method: req.method, body }, mockRes)
        } catch (error) {
          console.error('plan-trip dev middleware error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev middleware crashed', kind: 'llm_error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['ANTHROPIC_API_KEY', 'DUFFEL_ACCESS_TOKEN', 'SERP_API_KEY']) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), planTripDevMiddleware()],
  }
})
