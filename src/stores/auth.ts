import {defineStore} from 'pinia';
import {ref} from 'vue';
import axios from 'axios';

type UserData = {
    email: string;
    password: string;
};

export const useAuthStore = defineStore('auth', () => {
    const isAuthenticated = ref(false);
    const errorMessage = ref('');

    async function register(userData : UserData) {
        try {
            await axios.post('/api/user', userData);
            await login(userData);
        } catch (error) {
            console.error('Registration failed:', error);
            errorMessage.value = 'Registration failed. Please try again.';
        }
    }

    async function login(userData : UserData) {
        try {
            const response = await axios.post('/api/auth/login', userData);
            isAuthenticated.value = true;
            const token = response.data.token;
            axios.defaults.headers.common['Authorization'] = token;
            console.log('Login successful:', response.data);
        } catch (error) {
            console.error('Login failed:', error);
            errorMessage.value = 'Login failed. Please check your credentials and try again.';
        }
    }

    function logout() {
        isAuthenticated.value = false;
        delete axios.defaults.headers.common['Authorization'];
        console.log('User logged out.');
    }

    return {
        isAuthenticated,
        login,
        logout,
        register,
        errorMessage
    };
});
