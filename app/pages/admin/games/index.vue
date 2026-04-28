<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NButton,
  NTag,
  NSpace,
  NEmpty,
  NIcon,
} from 'naive-ui'
import { Add } from '@vicons/ionicons5'
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import type { Database } from '~/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin'],
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()

const { data: games } = await useAsyncData('admin-games', async () => {
  const { data } = await supabase
    .from('games')
    .select('*')
    .order('played_at', { ascending: false })
  return data ?? []
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'uzc' ? 'uz' : 'uz-Latn', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  upcoming: 'info',
  team_formed: 'warning',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const columns = computed<DataTableColumns<Game>>(() => [
  {
    title: t('games.create.date'),
    key: 'played_at',
    render: (row) =>
      h('div', null, [
        h('div', { style: 'font-weight:500' }, formatDate(row.played_at)),
        h(
          'div',
          { style: 'opacity:.6;font-size:12px' },
          row.location || ''
        ),
      ]),
  },
  {
    title: 'Status',
    key: 'status',
    width: 160,
    render: (row) =>
      h(
        NTag,
        { round: true, type: statusColor[row.status] ?? 'default', size: 'small' },
        { default: () => t(`games.status.${row.status}`) }
      ),
  },
  {
    title: '',
    key: 'actions',
    width: 100,
    align: 'right',
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          onClick: () => navigateTo(localePath(`/admin/games/${row.id}`)),
        },
        { default: () => t('common.edit') }
      ),
  },
])
</script>

<template>
  <div class="admin-games">
    <header class="head">
      <h1 class="title">{{ t('admin.manage_games') }}</h1>
      <NButton type="primary" @click="navigateTo(localePath('/admin/games/new'))">
        <template #icon>
          <NIcon><Add /></NIcon>
        </template>
        {{ t('games.create.title') }}
      </NButton>
    </header>

    <NCard v-if="games?.length">
      <NDataTable :columns="columns" :data="games" :bordered="false" />
    </NCard>
    <NCard v-else>
      <NEmpty :description="t('games.no_upcoming')" />
    </NCard>
  </div>
</template>

<style scoped>
.admin-games {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
</style>
