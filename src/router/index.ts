import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/form/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Form/DashboardView.vue'),
    },
    {
      path: '/form/:formId/edit',
      name: 'editForm',
      component: () => import('@/views/Form/EditView.vue'),
    },
    {
      path: '/form/:formId',
      name: 'publicForm',
      component: () => import('@/views/Form/PublicView.vue'),
    },
    {
      path: '/form/:formId/response',
      name: 'formResponses',
      component: () => import('@/views/Form/ResponsesView.vue'),
    },
  ],
})

export default router
