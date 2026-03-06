<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

type QuestionType = "short" | "long" | "single" | "multiple";

type Question = {
  id: number;
  title: string;
  description?: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
};

type LogicRule = {
  questionId: number;
  operator: "equals" | "not_equals";
  value: string;
  destinationPageId: number | "end";
};

type Page = {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  logic?: LogicRule[];
}

const route = useRoute();
const projectId = route.params.projectId as string;

const projectMeta = ref({
  title: "",
  description: "",
});

const pages = ref<Page[]>([]);
const currentPageIndex = ref(0);
const navigationHistory = ref<number[]>([]); // Stack of visited page indexes

const fetchProjectData = async (id: string) => {
  try {
    const response = await axios.get(`/api/projects/${id}/public`);
    const data = response.data;

    projectMeta.value = {
      title: data.project.title,
      description: data.project.description,
    };

    pages.value = data.pages;
  } catch (error) {
    console.error("Error fetching project:", error);
  }
};

onMounted(() => {
  fetchProjectData(projectId);
});

const clearAnswers = () => {
  for (const key in answers) {
    delete answers[key];
  }
};

// Responses stored flatly
const answers = reactive<Record<string, string | string[]>>({});

const isSubmitting = ref(false);
const submitted = ref(false);

const currentQuestions = computed(() => {
  if (pages.value.length === 0) return [];
  if (!pages.value[currentPageIndex.value]) return [];
  return pages.value[currentPageIndex.value].questions || [];
});

const hasNextPage = computed(() => {
  const nextTarget = getNextPageIndex();
  return nextTarget !== "end" && nextTarget !== -1;
});
const hasPrevPage = computed(() => currentPageIndex.value > 0 || navigationHistory.value.length > 0);

function getNextPageIndex(): number | "end" {
  const currentPage = pages.value[currentPageIndex.value];
  if (!currentPage) return -1;

  // Evaluate Logic Rules
  if (currentPage.logic && Array.isArray(currentPage.logic)) {
    for (const rule of currentPage.logic) {
      const answerKey = `${currentPage.id}_${rule.questionId}`;
      const answer = answers[answerKey];
      let match = false;

      // Handle String comparison for consistency
      const answerStr = answer === undefined ? "" : String(answer).trim().toLowerCase();
      const ruleValueStr = String(rule.value || "").trim().toLowerCase();

      if (rule.operator === "equals") {
        match = answerStr === ruleValueStr;
      } else if (rule.operator === "not_equals") {
        match = answerStr !== ruleValueStr;
      }

      if (match) {
        if (rule.destinationPageId === "end") {
          return "end";
        }

        const targetId = Number(rule.destinationPageId);
        const targetIndex = pages.value.findIndex(p => Number(p.id) === targetId);
        if (targetIndex !== -1) {
          return targetIndex;
        }
      }
    }
  }

  // Default to next sequential page if it exists
  if (currentPageIndex.value < pages.value.length - 1) {
    return currentPageIndex.value + 1;
  }

  return "end";
}

function nextPage() {
  const nextTarget = getNextPageIndex();

  if (nextTarget === "end") {
    onSubmit(true);
    return;
  }

  if (typeof nextTarget === "number" && nextTarget !== -1) {
    navigationHistory.value.push(currentPageIndex.value);
    currentPageIndex.value = nextTarget;
    window.scrollTo(0, 0);
  }
}

function prevPage() {
  if (navigationHistory.value.length > 0) {
    const lastPage = navigationHistory.value.pop()!;
    currentPageIndex.value = lastPage;
    window.scrollTo(0, 0);
  } else if (currentPageIndex.value > 0) {
    currentPageIndex.value--;
    window.scrollTo(0, 0);
  }
}

async function onSubmit(eventOrForce?: any) {
  const forceFinish = eventOrForce === true;
  const nextTarget = getNextPageIndex();

  if (nextTarget !== "end" && !forceFinish) {
      nextPage();
      return;
  }

  submitted.value = false;
  isSubmitting.value = true;
  try {
    await axios.post(`/api/projects/${projectId}/responses`, {
      responses: answers,
    });
    submitted.value = true;
    clearAnswers();
  } catch (error) {
    console.error("Error submitting project:", error);
  } finally {
    isSubmitting.value = false;
  }
}

function ensureMultiAnswer(key: string) {
  if (!Array.isArray(answers[key])) answers[key] = [];
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <!-- Header -->
        <div class="border-b border-slate-200 px-6 py-6 sm:px-8">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Public Survey</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ projectMeta.title }}</h1>
          <p v-if="projectMeta.description" class="mt-2 text-sm text-slate-600">{{ projectMeta.description }}</p>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 sm:px-8">
          <div v-if="pages.length === 0" class="py-12 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <h2 class="mt-4 text-sm font-semibold text-slate-900">No pages yet</h2>
            <p class="mt-1 text-sm text-slate-600">This project doesn’t have any content yet.</p>
          </div>

          <div v-else-if="submitted" class="py-12 text-center">
             <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 class="text-2xl font-semibold text-slate-900 mb-2">Thank you!</h2>
            <p class="text-slate-600">Your response has been successfully recorded.</p>
          </div>

          <form v-else class="space-y-6" @submit.prevent="onSubmit">

            <!-- Page Header -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-indigo-600">Page {{ currentPageIndex + 1 }} of {{ pages.length }}</span>
                    <div class="flex gap-1 h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div v-for="i in pages.length" :key="i" class="h-full flex-1 transition-colors" :class="i - 1 <= currentPageIndex ? 'bg-indigo-500' : 'bg-transparent'"></div>
                    </div>
                </div>
                <h3 class="text-lg font-medium text-slate-900">{{ pages[currentPageIndex].title }}</h3>
                <p v-if="pages[currentPageIndex].description" class="mt-1 text-sm text-slate-500">{{ pages[currentPageIndex].description }}</p>
            </div>

            <div v-if="currentQuestions.length === 0" class="py-8 text-center bg-slate-50 rounded-lg border border-slate-100">
               <p class="text-sm text-slate-500">No questions on this page.</p>
            </div>

            <div v-for="(q, idx) in currentQuestions" :key="q.id" class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {{ idx + 1 }}
                    </span>
                    <span v-if="q.required" class="text-xs font-semibold text-amber-700">Required</span>
                  </div>
                  <label :for="`q-${q.id}`" class="mt-2 block text-sm font-semibold text-slate-900">
                    {{ q.title }}
                  </label>
                  <p v-if="q.description" class="mt-1 text-sm text-slate-600">{{ q.description }}</p>
                </div>
              </div>

              <div class="mt-4">
                <!-- Short -->
                <input
                  v-if="q.type === 'short'"
                  :id="`q-${q.id}`"
                  v-model="(answers[`${pages[currentPageIndex].id}_${q.id}`] as string)"
                  type="text"
                  :required="!!q.required"
                  placeholder="Your answer"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <!-- Long -->
                <textarea
                  v-else-if="q.type === 'long'"
                  :id="`q-${q.id}`"
                  v-model="(answers[`${pages[currentPageIndex].id}_${q.id}`] as string)"
                  rows="4"
                  :required="!!q.required"
                  placeholder="Your answer"
                  class="block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <!-- Single choice -->
                <div v-else-if="q.type === 'single'" class="grid gap-2">
                  <label
                    v-for="(opt, oi) in q.options || []"
                    :key="oi"
                    class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      v-model="(answers[`${pages[currentPageIndex].id}_${q.id}`] as string)"
                      :name="`q-${pages[currentPageIndex].id}-${q.id}`"
                      type="radio"
                      :value="opt"
                      class="h-4 w-4 text-indigo-600"
                      :required="!!q.required"
                    />
                    {{ opt }}
                  </label>
                </div>

                <!-- Multiple choice -->
                <div v-else class="grid gap-2">
                  <label
                    v-for="(opt, oi) in q.options || []"
                    :key="oi"
                    class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      :checked="Array.isArray(answers[`${pages[currentPageIndex].id}_${q.id}`]) && (answers[`${pages[currentPageIndex].id}_${q.id}`] as string[]).includes(opt)"
                      type="checkbox"
                      :value="opt"
                      class="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      @change="ensureMultiAnswer(`${pages[currentPageIndex].id}_${q.id}`)"
                      v-model="(answers[`${pages[currentPageIndex].id}_${q.id}`] as string[])"
                    />
                    {{ opt }}
                  </label>
                </div>

                <p v-if="(q.type === 'single' || q.type === 'multiple') && !(q.options && q.options.length)" class="mt-2 text-sm text-slate-500">
                  No options available.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                <div>
                  <button
                    v-if="hasPrevPage"
                    type="button"
                    class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    @click="prevPage"
                  >
                    Previous
                  </button>
                </div>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    @click="answers && Object.keys(answers).forEach((k) => { if (k.startsWith(`${pages[currentPageIndex].id}_`)) delete answers[k] })"
                  >
                    Clear Page
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                  >
                    <span v-if="isSubmitting">Please wait…</span>
                    <span v-else-if="hasNextPage">Next</span>
                    <span v-else>Submit</span>
                  </button>
                </div>
            </div>

            <p class="text-xs text-slate-500 text-center mt-4">This is a public form. Don’t share sensitive information.</p>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-slate-500">Powered by Formce</p>
    </div>
  </div>
</template>

<style scoped></style>
