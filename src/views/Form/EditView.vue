<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import axios from "axios";

type QuestionType = "short" | "long" | "single" | "multiple";

type Question = {
  id: number;
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
};

const route = useRoute();
const formId = route.params.formId as string;

const questions = ref<Question[]>([
  {
    id: 1,
    title: "What is your name?",
    type: "short",
    required: true,
  },
]);

const fetchQuestions = async () => {
  try {
    const response = await axios.get(`/api/forms/${formId}`);
    if(response.data.questions.length !== 0) {
      questions.value = response.data.questions;
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
  }
};

fetchQuestions();

const draft = ref<{ title: string; type: QuestionType; required: boolean; options: string[] }>({
  title: "",
  type: "short",
  required: false,
  options: ["Option 1", "Option 2"],
});

const showOptions = computed(() => draft.value.type === "single" || draft.value.type === "multiple");

function addOption() {
  draft.value.options.push(`Option ${draft.value.options.length + 1}`);
}

function removeOption(index: number) {
  draft.value.options.splice(index, 1);
}

function clearDraft() {
  draft.value.title = "";
  draft.value.type = "short";
  draft.value.required = false;
  draft.value.options = ["Option 1", "Option 2"];
}

async function addQuestion() {
  const title = draft.value.title.trim();
  if (!title) return;

  const last = questions.value.length ? questions.value[questions.value.length - 1] : undefined;
  const nextId = ((last && last.id) || 0) + 1;

  await questions.value.push({
    id: nextId,
    title,
    type: draft.value.type,
    required: draft.value.required,
    options: showOptions.value
      ? draft.value.options.map((o) => o.trim()).filter(Boolean)
      : undefined,
  });

  clearDraft();
}

function removeQuestion(id: number) {
  questions.value = questions.value.filter((q) => q.id !== id);
}

const editingId = ref<number | null>(null);
const editDraft = ref<{ title: string; type: QuestionType; required: boolean; options: string[] }>({
  title: "",
  type: "short",
  required: false,
  options: [],
});

const showEditOptions = computed(() => editDraft.value.type === "single" || editDraft.value.type === "multiple");

function startEdit(q: Question) {
  editingId.value = q.id;
  editDraft.value = {
    title: q.title,
    type: q.type,
    required: q.required,
    options: (q.options ?? []).slice(),
  };

  if (showEditOptions.value && editDraft.value.options.length === 0) {
    editDraft.value.options = ["Option 1", "Option 2"]; // convenience default
  }
}

function cancelEdit() {
  editingId.value = null;
}

function addEditOption() {
  editDraft.value.options.push(`Option ${editDraft.value.options.length + 1}`);
}

function removeEditOption(index: number) {
  editDraft.value.options.splice(index, 1);
}

function saveEdit(id: number) {
  const q = questions.value.find((x) => x.id === id);
  if (!q) return;

  q.title = editDraft.value.title.trim() || q.title;
  q.type = editDraft.value.type;
  q.required = editDraft.value.required;

  if (showEditOptions.value) {
    q.options = editDraft.value.options.map((o) => o.trim()).filter(Boolean);
  } else {
    q.options = undefined;
  }

  editingId.value = null;
}

async function saveChanges() {
  await axios.post(`/api/forms/${formId}/add`, {
    questions: questions.value,
  });
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <RouterLink
              to="/forms/dashboard"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </RouterLink>
            <span class="text-xs text-slate-500">Editing</span>
          </div>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Form Builder</h1>
          <p class="mt-1 text-sm text-slate-600">Add questions, change types, and reorder later.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Preview
          </button>
          <button
            @click="saveChanges"
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            Save
          </button>
        </div>
      </div>

      <!-- Builder Layout -->
      <div class="mt-8 grid gap-6 lg:grid-cols-12">
        <!-- Questions List -->
        <section class="lg:col-span-7">
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">Questions</h2>
                <p class="mt-1 text-sm text-slate-600">All questions in this form.</p>
              </div>
            </div>

            <div class="divide-y divide-slate-200">
              <div v-if="questions.length === 0" class="p-10 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-sm font-semibold text-slate-900">No questions yet</h3>
                <p class="mt-1 text-sm text-slate-600">Add your first question using the panel on the right.</p>
              </div>

              <div v-for="(q, idx) in questions" :key="q.id" class="p-6">
                <!-- Inline edit mode -->
                <div v-if="editingId === q.id" class="space-y-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          #{{ idx + 1 }}
                        </span>
                        <span class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                          Editing
                        </span>
                      </div>
                      <p class="mt-2 text-sm text-slate-600">Update the question details and save.</p>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        @click="cancelEdit"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                        @click="saveEdit(q.id)"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-slate-700">Question</label>
                      <input
                        v-model="editDraft.title"
                        type="text"
                        class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700">Type</label>
                      <select
                        v-model="editDraft.type"
                        class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                        <option value="single">Single choice</option>
                        <option value="multiple">Multiple choice</option>
                      </select>
                    </div>

                    <div class="flex items-end">
                      <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input v-model="editDraft.required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                        Required
                      </label>
                    </div>
                  </div>

                  <div v-if="showEditOptions" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-slate-900">Options</h4>
                      <button
                        type="button"
                        class="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        @click="addEditOption"
                      >
                        Add option
                      </button>
                    </div>

                    <div class="mt-3 space-y-3">
                      <div v-for="(opt, i) in editDraft.options" :key="i" class="flex items-center gap-2">
                        <span class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600">{{ i + 1 }}</span>
                        <input
                          v-model="editDraft.options[i]"
                          type="text"
                          class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          class="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700"
                          title="Remove"
                          @click="removeEditOption(i)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Readonly mode -->
                <div v-else>
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          #{{ idx + 1 }}
                        </span>
                        <span class="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                          {{
                            q.type === 'short'
                              ? 'Short'
                              : q.type === 'long'
                                ? 'Long'
                                : q.type === 'single'
                                  ? 'Single choice'
                                  : 'Multiple choice'
                          }}
                        </span>
                        <span v-if="q.required" class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          Required
                        </span>
                      </div>
                      <h3 class="mt-2 truncate text-base font-semibold text-slate-900">{{ q.title }}</h3>
                      <p class="mt-1 text-sm text-slate-600">
                        {{ q.type === 'short' ? 'Short answer' : q.type === 'long' ? 'Long answer' : q.type === 'single' ? 'Select one option' : 'Select all that apply' }}
                      </p>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        @click="startEdit(q)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        @click="removeQuestion(q.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <!-- Preview -->
                  <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div v-if="q.type === 'short'" class="h-9 w-full rounded-md border border-slate-200 bg-white" />
                    <div v-else-if="q.type === 'long'" class="h-24 w-full rounded-md border border-slate-200 bg-white" />

                    <div v-else class="grid gap-2">
                      <label
                        v-for="(opt, oi) in q.options || []"
                        :key="`${q.id}-${oi}`"
                        class="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          :type="q.type === 'single' ? 'radio' : 'checkbox'"
                          :name="`q-${q.id}`"
                          class="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        {{ opt }}
                      </label>
                      <p v-if="!(q.options && q.options.length)" class="text-sm text-slate-500">No options yet.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Add Question Panel -->
        <aside class="lg:col-span-5">
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-6 py-4">
              <h2 class="text-sm font-semibold text-slate-900">Add a question</h2>
              <p class="mt-1 text-sm text-slate-600">Choose a type and configure its settings.</p>
            </div>

            <form class="space-y-4 px-6 py-5" @submit.prevent="addQuestion">
              <div>
                <label for="q-title" class="block text-sm font-medium text-slate-700">Question</label>
                <div class="mt-1">
                  <input
                    id="q-title"
                    v-model="draft.title"
                    type="text"
                    placeholder="Type your question..."
                    class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="q-type" class="block text-sm font-medium text-slate-700">Type</label>
                  <div class="mt-1">
                    <select
                      id="q-type"
                      v-model="draft.type"
                      class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="short">Short</option>
                      <option value="long">Long</option>
                      <option value="single">Single choice</option>
                      <option value="multiple">Multiple choice</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-end">
                  <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input v-model="draft.required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                    Required
                  </label>
                </div>
              </div>

              <!-- Options (only for choice questions) -->
              <div v-if="showOptions" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-900">Options</h3>
                  <button type="button" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700" @click="addOption">
                    Add option
                  </button>
                </div>

                <div class="mt-3 space-y-3">
                  <div v-for="(opt, i) in draft.options" :key="i" class="flex items-center gap-2">
                    <span class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600">{{ i + 1 }}</span>
                    <input
                      v-model="draft.options[i]"
                      type="text"
                      :placeholder="`Option ${i + 1}`"
                      class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <button type="button" class="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700" title="Remove" @click="removeOption(i)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p class="mt-3 text-xs text-slate-500">Options are used for single/multiple choice questions.</p>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  @click="clearDraft"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  Add question
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
