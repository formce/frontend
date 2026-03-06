<script setup lang="ts">
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import axios from "axios";
import PageLogicModal from "./PageLogicModal.vue";
const route = useRoute();
const projectId = route.params.projectId as string;
const project = ref<{ id: number; title: string; description: string; createdAt: string } | null>(null);
const pages = ref<Array<{ id: number; title: string; description: string; createdAt: string; questions: any[]; logic: any[] }>>([]);
const fetchProjectData = async () => {
  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    project.value = response.data.project;
    pages.value = response.data.pages;
  } catch (error) {
    console.error("Error fetching project data:", error);
  }
};
const isCreateOpen = ref(false);
const newPage = ref({
  title: "",
  description: "",
});
const createPage = async () => {
  try {
    await axios.post(`/api/projects/${projectId}/pages`, newPage.value);
  } catch (error) {
    console.error("Error creating page:", error);
  } finally {
    isCreateOpen.value = false;
    newPage.value = { title: "", description: "" };
    fetchProjectData();
  }
};

// --- Drag & Drop for Pages ---
const draggedPageIndex = ref<number | null>(null);
const dropTargetPageIndex = ref<number | null>(null);

function handleDragStartPage(e: DragEvent, index: number) {
  draggedPageIndex.value = index;
  if(e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'move';
     e.dataTransfer.setData('text/plain', index.toString());
  }
}

function handleDragOverPage(e: DragEvent, index: number) {
  e.preventDefault();
  dropTargetPageIndex.value = index;
}

async function handleDropPage(e: DragEvent, index: number) {
  e.preventDefault();

  if (draggedPageIndex.value !== null && draggedPageIndex.value !== index) {
      const fromIdx = draggedPageIndex.value;
      const toIdx = index;

      const [movedPage] = pages.value.splice(fromIdx, 1);
      // Because we removed an item, the target index might shift if we are moving down
      const adjustedToIdx = toIdx > fromIdx ? toIdx - 1 : toIdx;
      pages.value.splice(adjustedToIdx, 0, movedPage);

      // Save new order to backend
      const pageIds = pages.value.map(p => p.id);
      try {
          await axios.put(`/api/projects/${projectId}/pages/reorder`, { pageIds });
      } catch (error) {
          console.error("Failed to save page order", error);
      }
  }

  draggedPageIndex.value = null;
  dropTargetPageIndex.value = null;
}

function handleDragEndPage() {
  draggedPageIndex.value = null;
  dropTargetPageIndex.value = null;
}

// --- Logic Modal State ---
const isLogicOpen = ref(false);
const selectedPageForLogic = ref<any>(null);

function openLogic(page: any) {
  selectedPageForLogic.value = page;
  isLogicOpen.value = true;
}

async function saveLogic(logic: any) {
  if (!selectedPageForLogic.value) return;

  try {
    await axios.post(`/api/projects/${projectId}/pages/${selectedPageForLogic.value.id}/logic`, { logic });
    selectedPageForLogic.value.logic = logic;
  } catch (error) {
    console.error("Failed to save page logic", error);
  } finally {
    isLogicOpen.value = false;
  }
}

fetchProjectData();
</script>
<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Create page modal -->
    <div v-if="isCreateOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-slate-900/40" @click="isCreateOpen = false" />
      <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md">
        <div class="flex h-full flex-col bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">New page</h2>
              <p class="mt-1 text-sm text-slate-600">Add a title and description for this page.</p>
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
            id="create-page"
            class="flex-1 space-y-4 overflow-y-auto px-6 py-5"
            @submit.prevent="createPage"
          >
            <div>
              <label for="title" class="block text-sm font-medium text-slate-700">Title</label>
              <div class="mt-1">
                <input
                  id="title"
                  v-model.trim="newPage.title"
                  type="text"
                  placeholder="e.g. Page 1: Personal Details"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-slate-700">Description</label>
              <div class="mt-1">
                <textarea
                  id="description"
                  v-model.trim="newPage.description"
                  rows="4"
                  placeholder="Optional context for this page..."
                  class="block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
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
              form="create-page"
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Logic Modal -->
    <PageLogicModal
      v-if="selectedPageForLogic"
      :is-open="isLogicOpen"
      :current-page="selectedPageForLogic"
      :all-pages="pages"
      :initial-logic="selectedPageForLogic.logic || []"
      @close="isLogicOpen = false"
      @save="saveLogic"
    />

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <RouterLink
              to="/projects/dashboard"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Projects
            </RouterLink>
            <span class="text-xs text-slate-500">Managing Project</span>
          </div>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{{ project?.title || 'Loading...' }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ project?.description || 'Manage your project pages here.' }}</p>
        </div>
        <div class="flex w-full gap-3 sm:w-auto">
          <RouterLink
            :to="`/projects/${projectId}/public`"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            Preview Project
          </RouterLink>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            @click="isCreateOpen = true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
            </svg>
            New Page
          </button>
        </div>
      </div>
      <!-- Content -->
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Page Cards -->
        <div
          v-for="(page, index) in pages"
          :key="page.id"
          class="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all cursor-move"
          :class="{
             'border-indigo-400 ring-2 ring-indigo-100 scale-[1.02] z-10': dropTargetPageIndex === index && dropTargetPageIndex !== draggedPageIndex,
             'opacity-50 border-dashed': draggedPageIndex === index
          }"
          draggable="true"
          @dragstart="handleDragStartPage($event, index)"
          @dragover.prevent="handleDragOverPage($event, index)"
          @drop.stop="handleDropPage($event, index)"
          @dragend="handleDragEndPage"
        >
          <div class="p-6 flex-1">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Page {{ index + 1 }}
              </span>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-slate-900">{{ page.title }}</h3>
            <p class="mt-2 text-sm text-slate-600 line-clamp-2">{{ page.description || 'No description provided.' }}</p>

            <div v-if="page.logic && page.logic.length > 0" class="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              {{ page.logic.length }} branching rules
            </div>
          </div>
          <div class="border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl grid grid-cols-2 gap-2">
            <button
              @click.stop="openLogic(page)"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Logic
            </button>
            <RouterLink
              :to="`/projects/${projectId}/pages/${page.id}/edit`"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 border border-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.1 2.1 0 0 1 2.97 2.97L8.5 18.79 4 20l1.21-4.5L16.862 4.487Z" />
              </svg>
              Edit Questions
            </RouterLink>
          </div>
        </div>
        <!-- Add New Page Card / Dropzone to bottom -->
        <button
          @dragover.prevent="handleDragOverPage($event, pages.length)"
          @drop.stop="handleDropPage($event, pages.length)"
          @click="isCreateOpen = true"
          class="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          :class="{'border-indigo-400 bg-indigo-50': dropTargetPageIndex === pages.length}"
        >
          <div class="rounded-full bg-white p-3 shadow-sm border border-slate-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </div>
          <span class="font-medium">Add New Page</span>
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped></style>
