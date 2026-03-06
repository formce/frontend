import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

type UserData = {
  email: string;
  password: string;
};

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const errorMessage = ref('');

  async function register(userData: UserData) {
    try {
      await axios.post('/api/user', userData);
      await login(userData);
    } catch (error) {
      console.error('Registration failed:', error);
      errorMessage.value = 'Registration failed. Please try again.';
    }
  }

  async function login(userData: UserData) {
    try {
      const response = await axios.post('/api/auth/login', userData);
      isAuthenticated.value = true;
      const token = response.data.token;
      axios.defaults.headers.common['Authorization'] = token;
      localStorage.setItem('auth_token', token);
      errorMessage.value = '';
    } catch (error) {
      console.error('Login failed:', error);
      errorMessage.value = 'Login failed. Please check your credentials and try again.';
      throw error;
    }
  }

  function logout() {
    isAuthenticated.value = false;
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
    console.log('User logged out.');
  }

  async function initializeAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
      try {
        await axios.get('/api/auth/me');
        isAuthenticated.value = true;
      } catch (error) {
        logout();
      }
    } else {
      isAuthenticated.value = false;
    }
  }

  return {
    isAuthenticated,
    login,
    logout,
    register,
    initializeAuth,
    errorMessage
  };
});
