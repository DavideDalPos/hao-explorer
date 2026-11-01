import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import TermView from './views/TermView.vue'
import RefView from './views/RefView.vue'
import ReferencesView from './views/ReferencesView.vue'
import './style.css'

const router = createRouter({
  // hash links (#/term/HAO_0000575) work on any static host, GitHub Pages included
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/term/:id', component: TermView, props: true },
    { path: '/references', component: ReferencesView },
    { path: '/ref/:id', component: RefView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

createApp(App).use(router).mount('#app')
