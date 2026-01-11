<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { reactive } from "vue";
import { storeToRefs } from "pinia";

const form = reactive({
  email: "",
  password: "",
});

const authStore = useAuthStore();
const { errorMessage } = storeToRefs(authStore);

const onSubmit = async () => {
  await authStore.register(form);
};
</script>

<template>
  <div class="min-h-screen bg-linear-to-b from-slate-50 to-white">
    <div class="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div class="mb-6">
            <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
            <p class="mt-1 text-sm text-slate-600">Sign up with your email and password.</p>
          </div>

          <form class="space-y-4"
                @submit.prevent="onSubmit">
            <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {{ errorMessage }}
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
              <div class="mt-1">
                <input
                  v-model.trim="form.email"
                  id="email"
                  type="email"
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
                  v-model="form.password"
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <p class="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>
            </div>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              Create account
            </button>

            <p class="pt-2 text-center text-sm text-slate-600">
              Already have an account?
              <RouterLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-700">Sign in</RouterLink>
            </p>
          </form>
        </div>

        <p class="mt-6 text-center text-xs text-slate-500">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
