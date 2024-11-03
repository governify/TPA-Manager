import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default ({ mode }) => {
  // Take environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    test: {
      globals: true,
    },
    define: {
      "process.env.ASSETS_MANAGER_URL": JSON.stringify(env.ASSETS_MANAGER_URL || 'http://localhost:5200'),
      "process.env.REGISTRY_URL": JSON.stringify(env.REGISTRY_URL || 'http://localhost:5400'),
      "process.env.COLLECTOR_EVENTS_URL": JSON.stringify(env.COLLECTOR_EVENTS_URL || 'http://localhost:5500'),
      "process.env.SCOPE_MANAGER_URL": JSON.stringify(env.SCOPE_MANAGER_URL || 'http://localhost:5700'),
      "process.env.DASHBOARD_URL": JSON.stringify(env.DASHBOARD_URL || 'http://localhost:5600'),
      "process.env.REPORTER_URL": JSON.stringify(env.REPORTER_URL || 'http://localhost:5300'),
    }
  })
}
