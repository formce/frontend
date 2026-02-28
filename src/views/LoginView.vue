<script setup lang="ts">
import {useAuthStore} from "@/stores/auth";
import {storeToRefs} from "pinia";
import {reactive, ref} from "vue";
import {useRouter} from "vue-router";

const form = reactive({
  email: '',
  password: ''
});
const isSubmitting = ref(false);
const authStore = useAuthStore();
const {errorMessage, isAuthenticated} = storeToRefs(authStore);
const router = useRouter();

const onSubmit = async () => {
  isSubmitting.value = true;
  try {
    if (isAuthenticated.value) {
      router.push('/forms/dashboard');
    }
    await authStore.login(form);
    // Redirect to dashboard or home page after successful login
    if (isAuthenticated.value) {
      console.log("Rerouting to dashboard")
      router.push('/forms/dashboard');
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'An error occurred during login.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-linear-to-b from-slate-50 to-white">
    <div class="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div class="mb-6">
            <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p class="mt-1 text-sm text-slate-600">Sign in to continue to your dashboard.</p>
          </div>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {{ errorMessage }}
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
              <div class="mt-1">
                <input
                  id="email"
                  v-model.trim="form.email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="you@example.com"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
              <div class="mt-1">
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  autocomplete="current-password"
                  required
                  placeholder="••••••••"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>

              <RouterLink to="#" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </RouterLink>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span v-if="!isSubmitting">Sign in</span>
              <span v-else>Signing in…</span>
            </button>

            <p class="pt-2 text-center text-sm text-slate-600">
              Don’t have an account?
              <RouterLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-700">Create one</RouterLink>
            </p>
          </form>
        </div>

        <p class="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
