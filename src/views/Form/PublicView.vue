<script setup lang="ts">
import { computed, reactive, ref } from "vue";
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

const route = useRoute();
const formId = route.params.formId as string; // Placeholder form ID

const formMeta = ref({
  title: "",
  description: "",
});

const questions = ref<Question[]>([]);

const fetchFormData = async (id: string) => {
  const response = await axios.get(`/api/forms/${id}`);
  const formData = response.data;

  formMeta.value = {
    title: formData.form.title,
    description: formData.form.description,
  };

  questions.value = formData.questions;
};

fetchFormData(formId);

const clearAnswers = () => {
  for (const key in answers) {
    delete answers[Number(key)];
  }
};

// Responses (minimal client-side state)
const answers = reactive<Record<number, string | string[]>>({});

const isSubmitting = ref(false);
const submitted = ref(false);

const isEmpty = computed(() => questions.value.length === 0);

async function onSubmit() {
  submitted.value = false;
  isSubmitting.value = true;
  try {
    const response = await axios.post(`/api/forms/${formId}`, {
      responses: answers,
    });
    submitted.value = true;
    clearAnswers();
  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    isSubmitting.value = false;
  }
}

function ensureMultiAnswer(id: number) {
  if (!Array.isArray(answers[id])) answers[id] = [];
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <!-- Header -->
        <div class="border-b border-slate-200 px-6 py-6 sm:px-8">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Public form</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ formMeta.title }}</h1>
          <p v-if="formMeta.description" class="mt-2 text-sm text-slate-600">{{ formMeta.description }}</p>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 sm:px-8">
          <div v-if="isEmpty" class="py-12 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <h2 class="mt-4 text-sm font-semibold text-slate-900">No questions</h2>
            <p class="mt-1 text-sm text-slate-600">This form doesn’t have any questions yet.</p>
          </div>

          <form v-else class="space-y-6" @submit.prevent="onSubmit">
            <div v-if="submitted" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Thanks! Your response was submitted.
            </div>

            <div v-for="(q, idx) in questions" :key="q.id" class="rounded-xl border border-slate-200 bg-white p-4">
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

                <span
                  class="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200"
                >
                  {{ q.type === 'short' ? 'Short' : q.type === 'long' ? 'Long' : q.type === 'single' ? 'Single' : 'Multiple' }}
                </span>
              </div>

              <div class="mt-4">
                <!-- Short -->
                <input
                  v-if="q.type === 'short'"
                  :id="`q-${q.id}`"
                  v-model="(answers[q.id] as string)"
                  type="text"
                  :required="!!q.required"
                  placeholder="Your answer"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <!-- Long -->
                <textarea
                  v-else-if="q.type === 'long'"
                  :id="`q-${q.id}`"
                  v-model="(answers[q.id] as string)"
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
                      v-model="(answers[q.id] as string)"
                      :name="`q-${q.id}`"
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
                      :checked="Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)"
                      type="checkbox"
                      :value="opt"
                      class="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      @change="ensureMultiAnswer(q.id)"
                      v-model="(answers[q.id] as string[])"
                    />
                    {{ opt }}
                  </label>
                </div>

                <p v-if="(q.type === 'single' || q.type === 'multiple') && !(q.options && q.options.length)" class="mt-2 text-sm text-slate-500">
                  No options available.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                @click="answers && Object.keys(answers).forEach((k) => delete answers[Number(k)])"
              >
                Clear
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span v-if="!isSubmitting">Submit</span>
                <span v-else>Submitting…</span>
              </button>
            </div>

            <p class="text-xs text-slate-500">This is a public form. Don’t share sensitive information.</p>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-slate-500">Powered by Formce</p>
    </div>
  </div>
</template>

<style scoped></style>
