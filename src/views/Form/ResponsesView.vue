<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const projectId = route.params.projectId as string;

type Question = {
  id: number;
  title: string;
};

type Page = {
    id: number;
    title: string;
    questions: Question[];
}

type ResponseRow = {
  id: number;
  submittedAt: string;
  answers: Record<string, string | string[]>;
};

const projectTitle = ref("");

const pages = ref<Page[]>([]);

const responses = ref<ResponseRow[]>([]);

const fetchProjectData = async (id: string) => {
  try {
    const response = await axios.get(`/api/projects/${id}/responses`);
    const data = response.data;
    projectTitle.value = data.project.title;
    pages.value = data.pages;
    responses.value = data.responses;
  } catch (error) {
    console.error("Error fetching project responses:", error);
  }
};

onMounted(() => {
    fetchProjectData(projectId);
});

const isEmpty = computed(() => responses.value.length === 0);

const flatQuestions = computed(() => {
    const allQuestions: (Question & { pageId: number })[] = [];
    pages.value.forEach(p => {
        if (p.questions) {
            allQuestions.push(...p.questions.map(q => ({ ...q, pageId: p.id })));
        }
    });
    return allQuestions;
});

function formatAnswer(v: string | string[] | undefined) {
  if (v == null) return "—";
  return Array.isArray(v) ? v.join(", ") : v;
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <RouterLink
              to="/projects/dashboard"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Dashboard
            </RouterLink>
            <RouterLink
              :to="`/projects/${projectId}`"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Project
            </RouterLink>
            <span class="text-xs text-slate-500">Responses</span>
          </div>

          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{{ projectTitle || 'Loading...' }}</h1>
          <p class="mt-1 text-sm text-slate-600">All submissions for this project across all pages.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4">
          <h2 class="text-sm font-semibold text-slate-900">Responses</h2>
          <p class="mt-1 text-sm text-slate-600">
            Showing <span class="font-medium text-slate-900">{{ responses.length }}</span> submissions
          </p>
        </div>

        <div v-if="isEmpty" class="px-6 py-12 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h10M7 16h10" />
            </svg>
          </div>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">No responses yet</h3>
          <p class="mt-1 text-sm text-slate-600">When someone submits, you’ll see it here.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th scope="col" class="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Submitted
                </th>
                <th
                  v-for="q in flatQuestions"
                  :key="`${q.pageId}_${q.id}`"
                  scope="col"
                  class="min-w-[14rem] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  <div class="truncate" :title="q.title">{{ q.title }}</div>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-for="r in responses" :key="r.id" class="hover:bg-slate-50">
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{{ new Date(r.submittedAt).toLocaleString() }}</td>
                <td v-for="q in flatQuestions" :key="`${q.pageId}_${q.id}`" class="px-6 py-4 text-sm text-slate-900 truncate max-w-xs">
                  {{ formatAnswer(r.answers[`${q.pageId}_${q.id}`]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <p class="text-sm text-slate-600">Tip: Click “Export CSV” to download all responses.</p>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" disabled>
              Prev
            </button>
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
