import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' lets the built site work from any address (GitHub Pages, a subfolder, a USB stick)
export default defineConfig({
  base: './',
  plugins: [vue()]
})
