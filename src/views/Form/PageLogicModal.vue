<script setup lang="ts">
import { ref, computed, watch } from "vue";

type Question = {
  id: number;
  title: string;
  type: string;
  options?: string[];
};

type Page = {
  id: number;
  title: string;
};

type LogicRule = {
  questionId: number;
  operator: "equals" | "not_equals";
  value: string;
  destinationPageId: number | "end";
};

const props = withDefaults(defineProps<{
  isOpen: boolean;
  currentPage: { id: number; title: string; questions: Question[] };
  allPages: Page[];
  initialLogic?: LogicRule[];
}>(), {
  initialLogic: () => []
});

const emit = defineEmits(["close", "save"]);

const localRules = ref<LogicRule[]>([]);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    localRules.value = JSON.parse(JSON.stringify(props.initialLogic || []));
  }
});

const safeQuestions = computed(() => {
  const qs = props.currentPage?.questions;
  return Array.isArray(qs) ? qs.filter(q => q && typeof q === 'object' && 'id' in q) : [];
});

const availableDestinationPages = computed(() => {
  if (!Array.isArray(props.allPages)) return [];
  return props.allPages.filter(p => p && typeof p === 'object' && 'id' in p && p.id !== props.currentPage?.id);
});

function addRule() {
  if (safeQuestions.value.length === 0) return;

  localRules.value.push({
    questionId: (safeQuestions.value[0] as any).id,
    operator: "equals",
    value: "",
    destinationPageId: availableDestinationPages.value.length > 0 ? (availableDestinationPages.value[0] as any).id : "end"
  });
}

function removeRule(index: number) {
  if (localRules.value && index >= 0) {
    localRules.value.splice(index, 1);
  }
}

function handleSave() {
  emit("save", localRules.value);
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/40 transition-opacity" @click="emit('close')" />

      <div class="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Page Logic: {{ currentPage?.title || 'Unknown Page' }}</h3>
            <p class="mt-1 text-sm text-slate-600">Configure branching rules based on answers on this page.</p>
          </div>
          <button @click="emit('close')" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-6">
          <div v-if="safeQuestions.length === 0" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You need to add questions to this page before you can create logic rules.
          </div>

          <div v-else class="space-y-4">
            <div v-for="(rule, index) in localRules" :key="index" class="relative rounded-xl border border-slate-200 bg-slate-50 p-4 pt-8">
              <template v-if="rule && typeof rule === 'object'">
              <button
                @click="removeRule(index)"
                class="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-red-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>

              <div class="grid gap-4 sm:grid-cols-12 items-end">
                <div class="sm:col-span-4">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">If question</label>
                  <select v-model="rule.questionId" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option v-for="q in safeQuestions" :key="q.id" :value="q.id">{{ q.title }}</option>
                  </select>
                </div>

                <div class="sm:col-span-3">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Condition</label>
                  <select v-model="rule.operator" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does not equal</option>
                  </select>
                </div>

                <div class="sm:col-span-5">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Value</label>
                  <input v-model="rule.value" type="text" placeholder="e.g. Yes" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                </div>

                <div class="sm:col-span-12 flex items-center gap-3 mt-2">
                  <span class="text-sm font-medium text-slate-700">Then jump to</span>
                  <select v-model="rule.destinationPageId" class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">
                    <option v-for="p in availableDestinationPages" :key="p && (p as any).id" :value="p && (p as any).id">{{ p && (p as any).title }}</option>
                    <option value="end">Success / End of Form</option>
                  </select>
                </div>
              </div>
              </template>
            </div>

            <button
              @click="addRule"
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
              </svg>
              Add logic rule
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl">
          <button @click="emit('close')" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button @click="handleSave" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            Save Logic
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
