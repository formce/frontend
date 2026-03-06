import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.headers.post['Content-Type'] = 'application/json';

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth';

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore()

authStore.initializeAuth().then(() => {
  app.use(router)
  app.mount('#app')
}).catch(err => {
  app.use(router)
  app.mount('#app')
})
