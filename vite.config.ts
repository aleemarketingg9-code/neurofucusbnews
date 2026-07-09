import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
const base = process.env.GITHUB_PAGES === 'true' ? '/neurofucusbnews/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the service worker ourselves (see src/registerSW.ts) so
      // an available update can force an immediate reload instead of
      // silently leaving an already-open tab running an old JS bundle
      // against a service worker that has already switched its cache over
      // to the new deploy's assets (a real source of "stale/mismatched UI"
      // bug reports on repeat visits). Disable the plugin's own auto-injected
      // <script> so we don't double-register.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Bienestar Diario',
        short_name: 'Bienestar',
        description: 'Tu asistente personal de salud: sueño, calorías, actividad y nutrición.',
        theme_color: '#2a78d6',
        background_color: '#f9f9f7',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
