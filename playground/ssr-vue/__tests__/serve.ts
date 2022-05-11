// this is automatically detected by scripts/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'path'
import { ports } from '~utils'

export const port = ports['ssr-vue']

export async function serve(root, isProd) {
  if (isProd) {
    // build first
    const { build } = require('vite')
    // client build
    await build({
      root,
      logLevel: 'silent', // exceptions are logged by Jest
      build: {
        target: 'esnext',
        minify: false,
        ssrManifest: true,
        outDir: 'dist/client'
      }
    })
    // server build
    await build({
      root,
      logLevel: 'silent',
      build: {
        target: 'esnext',
        ssr: 'src/entry-server.js',
        outDir: 'dist/server'
      }
    })
  }

  const { createServer } = require(path.resolve(root, 'server.js'))
  const { app, vite } = await createServer(root, isProd)

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
            if (vite) {
              await vite.close()
            }
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}