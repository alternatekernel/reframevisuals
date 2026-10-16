import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  const singleFileBuild = process.env.VITE_SINGLE_FILE_BUILD === 'true'

  return {
    plugins: [react(), ...(singleFileBuild ? [viteSingleFile()] : [])],
    // Use absolute asset paths for deployed SPA routes like /admin/login.
    // Relative base causes /admin/assets/* requests that hit HTML fallback.
    base: singleFileBuild ? './' : '/',
    define: {
      'process.env.VITE_VERCEL_PROJECT_NAME': JSON.stringify('reframevisual-staging')
    },
    // SSR bundle (npm run build:ssr) is fully self-contained: every dependency
    // is bundled so the backend runtime image does not need frontend
    // node_modules to render pages.
    ssr: {
      noExternal: true as const,
    },
    environments: {
      ssr: {
        resolve: {
          noExternal: true as const,
        },
      },
    },
    build: {
      cssMinify: 'esbuild' as const,
      sourcemap: false,
      minify: 'esbuild' as const,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // manualChunks is a browser-loading optimization; keep the SSR
          // bundle's chunking default so Node can import it directly.
          manualChunks: isSsrBuild
            ? undefined
            : (id: string) => {
                if (id.includes('node_modules')) {
                  if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
                  if (id.includes('lucide-react')) return 'vendor-icons'
                  if (id.includes('@radix-ui')) return 'vendor-radix'
                  return 'vendor'
                }
              },
        },
      },
      esbuild: {
        drop: ['console', 'debugger'],
      },
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
})
