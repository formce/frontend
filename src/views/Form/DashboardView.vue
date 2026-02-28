<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { RouterLink } from "vue-router";

const forms = ref<Array<{ id: number; title: string; createdAt: string;}>>([]);

const count = ref<number>(0);

const fetchForms = async () => {
  try {
    const response = await axios.get("/api/forms");
    forms.value = response.data.forms;
    count.value = forms.value.length;
  } catch (error) {
    console.error("Error fetching forms:", error);
  }
};

const isCreateOpen = ref(false);
const newForm = ref({
  title: "",
  description: "",
});

const createForm = async () => {
  try {
    const response = await axios.post("/api/forms", newForm.value);
  } catch (error) {
    console.error("Error creating form:", error);
  } finally {
    isCreateOpen.value = false;
    fetchForms();
  }
};

fetchForms();


</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Create form modal -->
    <div v-if="isCreateOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-slate-900/40" @click="isCreateOpen = false" />

      <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md">
        <div class="flex h-full flex-col bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">New form</h2>
              <p class="mt-1 text-sm text-slate-600">Add a title and description to get started.</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              @click="isCreateOpen = false"
            >
              <span class="sr-only">Close</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form
            id="create-form"
            class="flex-1 space-y-4 overflow-y-auto px-6 py-5"
            @submit.prevent="createForm"
          >
            <div>
              <label for="title" class="block text-sm font-medium text-slate-700">Title</label>
              <div class="mt-1">
                <input
                  id="title"
                  v-model.trim="newForm.title"
                  type="text"
                  placeholder="e.g. Customer Feedback"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-slate-700">Description</label>
              <div class="mt-1">
                <textarea
                  id="description"
                  v-model.trim="newForm.description"
                  rows="4"
                  placeholder="Tell respondents what this form is for..."
                  class="block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <p class="mt-2 text-xs text-slate-500">You can edit this later.</p>
            </div>
          </form>

          <div class="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              @click="isCreateOpen = false"
            >
              Cancel
            </button>
            <button
              form="create-form"
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p class="mt-1 text-sm text-slate-600">Manage your forms: create, edit, and share.</p>
        </div>

        <div class="flex w-full gap-3 sm:w-auto">
          <div class="relative flex-1 sm:w-80 sm:flex-none">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search forms…"
              class="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            @click="isCreateOpen = true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
            </svg>
            New form
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-6 py-4">
          <h2 class="text-sm font-semibold text-slate-900">Your forms</h2>
          <p class="mt-1 text-sm text-slate-600">All forms you have created (newest first).</p>
        </div>

        <!-- Table (desktop) -->
        <div class="hidden overflow-x-auto sm:block">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Form
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Created
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <!-- Sample row (replace with v-for later) -->
              <tr v-for="form in forms" :key="form.id" class="hover:bg-slate-50">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-slate-900">{{ form.title }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-700">{{ form.createdAt }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Active</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <RouterLink
                      :to="`/forms/${form.id}/edit`"
                      class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.1 2.1 0 0 1 2.97 2.97L8.5 18.79 4 20l1.21-4.5L16.862 4.487Z" />
                      </svg>
                      Edit
                    </RouterLink>

                    <RouterLink
                      :to="`/forms/${form.id}/responses`"
                      class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10M7 12h10M7 17h10" />
                      </svg>
                      Responses
                    </RouterLink>

                    <RouterLink
                      :to="`/forms/${form.id}`"
                      class="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      title="Copy public link"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 4.93m4 6.07a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07" />
                      </svg>
                      View & Share
                    </RouterLink>
                  </div>
                </td>
              </tr>

              <!-- Empty-state row (keep for later) -->
              <tr class="hidden">
                <td colspan="4" class="px-6 py-12">
                  <div class="mx-auto max-w-sm text-center">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
                      </svg>
                    </div>
                    <h3 class="mt-4 text-sm font-semibold text-slate-900">No forms yet</h3>
                    <p class="mt-1 text-sm text-slate-600">Create your first form to start collecting responses.</p>
                    <button
                      type="button"
                      class="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
                      </svg>
                      New form
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards (mobile) -->
        <div class="divide-y divide-slate-200 sm:hidden">
          <!-- Sample card (replace with v-for later) -->
          <div class="p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="font-medium text-slate-900">Customer Feedback</div>
                <div class="mt-1 text-sm text-slate-600">Created 2026-01-11</div>
              </div>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Active</span>
            </div>
            <div class="mt-3 text-xs text-slate-500">/forms/customer-feedback</div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">Edit</button>
              <a href="#" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">View</a>
              <button type="button" class="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">Link</button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p class="text-sm text-slate-600">Showing <span class="font-medium text-slate-900">{{ count }}</span> forms</p>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" disabled>
              Prev
            </button>
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Tips / secondary section -->
      <div class="mt-8 grid gap-4 lg:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-900">Share your form</h3>
          <p class="mt-1 text-sm text-slate-600">Use the public link to collect responses from anyone.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-900">Edit anytime</h3>
          <p class="mt-1 text-sm text-slate-600">Update questions without losing your form link.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-900">View responses</h3>
          <p class="mt-1 text-sm text-slate-600">Track submissions and export when you’re ready.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
