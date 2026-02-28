import { createRouter, createWebHistory } from 'vue-router'
import {useAuthStore} from "@/stores/auth";
import {storeToRefs} from "pinia";

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
      path: '/forms/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Form/DashboardView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/forms/:formId/edit',
      name: 'editForm',
      component: () => import('@/views/Form/EditView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/forms/:formId',
      name: 'publicForm',
      component: () => import('@/views/Form/PublicView.vue'),
    },
    {
      path: '/forms/:formId/responses',
      name: 'formResponses',
      component: () => import('@/views/Form/ResponsesView.vue'),
      meta: {
        requiresAuth: true
      }
    },
  ],
})

router.beforeEach((to, from, next) =>{
  if (to.meta.requiresAuth){
    const authStore = useAuthStore();
    const {isAuthenticated} = storeToRefs(authStore);
    console.log(isAuthenticated.value)
    if(! isAuthenticated.value){
      next('/login')
    } else{
      next()
    }
  } else {
    next();
  }
})

export default router
