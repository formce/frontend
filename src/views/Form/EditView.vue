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
const projectId = route.params.projectId as string;
const pageId = route.params.pageId as string;

const pageTitle = ref('Loading Page...');

const questions = ref<Question[]>([]);

const fetchQuestions = async () => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/pages/${pageId}`);
    pageTitle.value = response.data.page.title;
    if(response.data.page.questions && response.data.page.questions.length !== 0) {
      questions.value = response.data.page.questions;
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
  }
};

fetchQuestions();

// --- Drag & Drop state ---
const draggedType = ref<QuestionType | null>(null);
const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

function handleDragStartSidebar(e: DragEvent, type: QuestionType) {
  draggedType.value = type;
  draggedIndex.value = null;
  if(e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'copy';
     e.dataTransfer.setData('text/plain', type);
  }
}

function handleDragStartList(e: DragEvent, index: number) {
  draggedIndex.value = index;
  draggedType.value = null;
  if(e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'move';
     e.dataTransfer.setData('text/plain', index.toString());
  }
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault();
  dropTargetIndex.value = index;
}

function handleDrop(e: DragEvent, index: number | null) {
  e.preventDefault();

  const targetIdx = index !== null ? index : questions.value.length;

  if (draggedType.value !== null) {
    // New question from sidebar
    const nextId = questions.value.length ? Math.max(...questions.value.map(q => q.id)) + 1 : 1;
    const newQ: Question = {
      id: nextId,
      title: 'New Question',
      type: draggedType.value,
      required: false,
      options: (draggedType.value === 'single' || draggedType.value === 'multiple') ? ['Option 1', 'Option 2'] : undefined
    };
    questions.value.splice(targetIdx, 0, newQ);
    startEdit(newQ); // Auto open for editing
  } else if (draggedIndex.value !== null) {
    // Reorder existing question
    const fromIdx = draggedIndex.value;
    const toIdx = targetIdx;

    if (fromIdx !== toIdx) {
      const [movedItem] = questions.value.splice(fromIdx, 1);
      // Because we removed an item, the target index might shift if we are moving down
      const adjustedToIdx = toIdx > fromIdx ? toIdx - 1 : toIdx;
      questions.value.splice(adjustedToIdx, 0, movedItem);
    }
  }

  // Resets
  draggedType.value = null;
  draggedIndex.value = null;
  dropTargetIndex.value = null;
}

function handleDragEnd() {
  draggedType.value = null;
  draggedIndex.value = null;
  dropTargetIndex.value = null;
}

function addQuestionToBottom(type: QuestionType) {
    const nextId = questions.value.length ? Math.max(...questions.value.map(q => q.id)) + 1 : 1;
    const newQ: Question = {
      id: nextId,
      title: 'New Question',
      type: type,
      required: false,
      options: (type === 'single' || type === 'multiple') ? ['Option 1', 'Option 2'] : undefined
    };
    questions.value.push(newQ);
    startEdit(newQ);
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
  await axios.post(`/api/projects/${projectId}/pages/${pageId}/questions`, {
    questions: questions.value,
  });
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <RouterLink
              :to="`/projects/${projectId}`"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to Project
            </RouterLink>
            <span class="text-xs text-slate-500">Editing Page</span>
          </div>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{{ pageTitle }}</h1>
          <p class="mt-1 text-sm text-slate-600">Drag items from the right to add them, and drag existing questions to reorder.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <RouterLink
            :to="`/projects/${projectId}/public`"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Preview Form
          </RouterLink>
          <button
            @click="saveChanges"
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            Save Questions
          </button>
        </div>
      </div>

      <!-- Builder Layout -->
      <div class="mt-8 grid gap-6 lg:grid-cols-12 items-start relative">
        <!-- Questions List Dropzone -->
        <section
            class="lg:col-span-8 min-h-[500px]"
            @dragover.prevent="handleDragOver($event, questions.length)"
            @drop="handleDrop($event, questions.length)"
        >
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-full pb-10">
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">Questions</h2>
                <p class="mt-1 text-sm text-slate-600">Drag to reorder.</p>
              </div>
            </div>

            <div class="divide-y divide-slate-100 flex flex-col gap-2 p-4">
              <div v-if="questions.length === 0" class="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 20h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.6-1.4l-2.5-2.5A2 2 0 0 0 14.5 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-sm font-semibold text-slate-900">No questions yet</h3>
                <p class="mt-1 text-sm text-slate-600">Drag your first question type from the sidebar into here.</p>
              </div>

              <div
                v-for="(q, idx) in questions"
                :key="q.id"
                class="rounded-xl border border-slate-200 bg-white transition-all shadow-sm"
                :class="{
                    'border-indigo-400 mt-8': dropTargetIndex === idx && dropTargetIndex !== draggedIndex,
                    'opacity-50 border-dashed': draggedIndex === idx
                }"
                draggable="true"
                @dragstart="handleDragStartList($event, idx)"
                @dragover.prevent="handleDragOver($event, idx)"
                @drop.stop="handleDrop($event, idx)"
                @dragend="handleDragEnd"
               >
                 <!-- Grab Handle / Header -->
                 <div class="bg-slate-50 rounded-t-xl px-4 py-2 border-b border-slate-100 flex items-center justify-between cursor-move hover:bg-slate-100">
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question {{ idx + 1 }}</span>
                    </div>
                 </div>

                 <div class="p-4">
                    <!-- Inline edit mode -->
                    <div v-if="editingId === q.id" class="space-y-4">
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0 flex-1">
                          <p class="mt-1 text-sm text-slate-600">Update the question details and save.</p>
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
                          <label class="block text-sm font-medium text-slate-700">Question Title</label>
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
                            <option value="short">Short Answer</option>
                            <option value="long">Long Answer</option>
                            <option value="single">Single Choice (Radio)</option>
                            <option value="multiple">Multiple Choice (Checkboxes)</option>
                          </select>
                        </div>

                        <div class="flex items-end">
                          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input v-model="editDraft.required" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                            Required
                          </label>
                        </div>
                      </div>

                      <div v-if="showEditOptions" class="rounded-xl border border-slate-200 bg-slate-50 p-4 mt-2">
                        <div class="flex items-center justify-between">
                          <h4 class="text-sm font-semibold text-slate-900">Options</h4>
                          <button
                            type="button"
                            class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm"
                            @click="addEditOption"
                          >
                            Add option
                          </button>
                        </div>

                        <div class="mt-4 space-y-3">
                          <div v-for="(opt, i) in editDraft.options" :key="i" class="flex items-center gap-2">
                            <span class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600">{{ i + 1 }}</span>
                            <input
                              v-model="editDraft.options[i]"
                              type="text"
                              class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />
                            <button
                              type="button"
                              class="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200"
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
                          <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                              {{
                                q.type === 'short'
                                  ? 'Short Answer'
                                  : q.type === 'long'
                                    ? 'Long Answer'
                                    : q.type === 'single'
                                      ? 'Single Choice'
                                      : 'Multiple Choice'
                              }}
                            </span>
                            <span v-if="q.required" class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                              Required
                            </span>
                          </div>
                          <h3 class="text-base font-medium text-slate-900">{{ q.title }}</h3>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            class="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                            @click="startEdit(q)"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            class="rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 shadow-sm transition-colors"
                            @click="removeQuestion(q.id)"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <!-- Preview -->
                      <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div v-if="q.type === 'short'" class="h-10 w-full rounded-md border border-slate-200 bg-white shadow-sm flex items-center px-3 text-slate-400 text-sm">Short text answer...</div>
                        <div v-else-if="q.type === 'long'" class="h-24 w-full rounded-md border border-slate-200 bg-white shadow-sm p-3 text-slate-400 text-sm">Long text answer paragraph...</div>

                        <div v-else class="grid gap-3">
                          <label
                            v-for="(opt, oi) in q.options || []"
                            :key="`${q.id}-${oi}`"
                            class="flex items-center gap-3 text-sm text-slate-700 bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
                          >
                            <input
                              :type="q.type === 'single' ? 'radio' : 'checkbox'"
                              :name="`q-${q.id}`"
                              class="text-indigo-600 border-slate-300"
                              :class="{ 'rounded-full': q.type === 'single', 'rounded': q.type === 'multiple' }"
                              disabled
                            />
                            {{ opt }}
                          </label>
                          <p v-if="!(q.options && q.options.length)" class="text-sm text-slate-500 italic">No options defined.</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Bottom Drop Area Filler -->
            <div
               class="h-24 m-4 border-2 border-transparent transition-colors rounded-xl flex items-center justify-center"
               :class="{'border-indigo-400 bg-indigo-50/50': dropTargetIndex === questions.length}"
               @dragover.prevent="handleDragOver($event, questions.length)"
               @drop.stop="handleDrop($event, questions.length)"
            >
                <span v-if="dropTargetIndex === questions.length" class="text-indigo-500 font-medium">Drop here to add to bottom</span>
            </div>
          </div>
        </section>

        <!-- Sidebar Panel for Draggables -->
        <aside class="lg:col-span-4 sticky top-10">
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="bg-indigo-600 px-6 py-4">
              <h2 class="text-sm font-semibold text-white flex items-center gap-2">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 Add new elements
              </h2>
              <p class="mt-1 text-sm text-indigo-100">Drag items to the left, or click to append.</p>
            </div>

            <div class="px-4 py-5 space-y-3 bg-slate-50 min-h-[400px]">

                 <!-- Short Answer Draggable -->
                 <div
                    class="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing group"
                    draggable="true"
                    @dragstart="handleDragStartSidebar($event, 'short')"
                    @dragend="handleDragEnd"
                    @click="addQuestionToBottom('short')"
                 >
                    <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    </div>
                    <div>
                        <div class="font-semibold text-slate-800 text-sm">Short Answer</div>
                        <div class="text-xs text-slate-500">A single-line text input</div>
                    </div>
                 </div>

                 <!-- Long Answer Draggable -->
                 <div
                    class="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing group"
                    draggable="true"
                    @dragstart="handleDragStartSidebar($event, 'long')"
                    @dragend="handleDragEnd"
                    @click="addQuestionToBottom('long')"
                 >
                    <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </div>
                    <div>
                        <div class="font-semibold text-slate-800 text-sm">Long Answer</div>
                        <div class="text-xs text-slate-500">A multi-line text paragraph</div>
                    </div>
                 </div>

                 <div class="border-t border-slate-200 my-2"></div>

                 <!-- Single Choice Draggable -->
                 <div
                    class="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing group"
                    draggable="true"
                    @dragstart="handleDragStartSidebar($event, 'single')"
                    @dragend="handleDragEnd"
                    @click="addQuestionToBottom('single')"
                 >
                    <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <div class="font-semibold text-slate-800 text-sm">Single Choice</div>
                        <div class="text-xs text-slate-500">Radio buttons to pick one option</div>
                    </div>
                 </div>

                 <!-- Multiple Choice Draggable -->
                 <div
                    class="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:cursor-grabbing group"
                    draggable="true"
                    @dragstart="handleDragStartSidebar($event, 'multiple')"
                    @dragend="handleDragEnd"
                    @click="addQuestionToBottom('multiple')"
                 >
                    <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <div>
                        <div class="font-semibold text-slate-800 text-sm">Multiple Choice</div>
                        <div class="text-xs text-slate-500">Checkboxes to pick multiple</div>
                    </div>
                 </div>

            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
