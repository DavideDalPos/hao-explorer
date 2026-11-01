// Light or dark page. Follows the computer's setting until the visitor picks one with the button in the header;
// the choice is remembered in this browser.
import { ref } from 'vue'

const KEY = 'hao-theme'
const saved = (() => {
  try { return localStorage.getItem(KEY) } catch { return null }
})()
const system = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export const theme = ref(saved === 'dark' || saved === 'light' ? saved : system())
document.documentElement.dataset.theme = theme.value

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!saved) setTheme(system(), false)
})

export function setTheme(t, remember = true) {
  theme.value = t
  document.documentElement.dataset.theme = t
  if (remember) try { localStorage.setItem(KEY, t) } catch { /* private window: not remembered */ }
}
export const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')
