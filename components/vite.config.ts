
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react({ jsxRuntime: 'classic' })],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/socket.io': {
          target: 'http://127.0.0.1:5000',
          ws: true,
          changeOrigin: true
        },
        '/connect': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/balance': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/assets': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/market_data': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/buy': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/check_win': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/ping': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/switch_account': { target: 'http://127.0.0.1:5000', changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})
