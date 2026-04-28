<script setup lang="ts">
import {
  NInput,
  NSelect,
  NSpace,
  NEmpty,
  NSpin,
  NIcon,
} from 'naive-ui'
import { Search } from '@vicons/ionicons5'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()

const search = ref('')
const positionFilter = ref<string | null>(null)

const positionOptions = computed(() => [
  { label: t('players.all_positions'), value: null },
  { label: t('profile.positions.GK'), value: 'GK' },
  { label: t('profile.positions.DEF'), value: 'DEF' },
  { label: t('profile.positions.MID'), value: 'MID' },
  { label: t('profile.positions.FWD'), value: 'FWD' },
])

const { data: players, pending } = await useAsyncData('players', async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('skill_rating', { ascending: false, nullsFirst: false })
    .order('full_name')
  return data ?? []
})

const filtered = computed(() => {
  if (!players.value) return []
  return players.value.filter((p) => {
    if (positionFilter.value && p.position !== positionFilter.value) return false
    if (search.value && !p.full_name.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
})
</script>

<template>
  <div class="players-page">
    <div class="header">
      <h1 class="title">{{ t('players.title') }}</h1>
      <span class="muted">{{ t('players.total', { count: filtered.length }) }}</span>
    </div>

    <NSpace class="filters" :wrap="true">
      <NInput
        v-model:value="search"
        :placeholder="t('players.search')"
        clearable
        class="search-input"
      >
        <template #prefix>
          <NIcon><Search /></NIcon>
        </template>
      </NInput>
      <NSelect
        v-model:value="positionFilter"
        :options="positionOptions"
        :placeholder="t('players.filter_position')"
        clearable
        class="filter-select"
      />
    </NSpace>

    <div v-if="pending" class="center">
      <NSpin />
    </div>
    <NEmpty
      v-else-if="!filtered.length"
      :description="t('players.no_results')"
    />
    <div v-else class="grid">
      <PlayerCard
        v-for="p in filtered"
        :key="p.id"
        :player="p"
        clickable
      />
    </div>
  </div>
</template>

<style scoped>
.players-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
.muted {
  opacity: 0.6;
  font-size: 14px;
}
.filters {
  margin-bottom: 8px;
}
.search-input {
  width: 280px;
  max-width: 100%;
}
.filter-select {
  width: 200px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
</style>
