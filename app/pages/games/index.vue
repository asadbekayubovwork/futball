<script setup lang="ts">
import {
  NCard,
  NTabs,
  NTabPane,
  NTag,
  NEmpty,
  NSpace,
} from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', middleware: ['auth'] })

type Game = Database['public']['Tables']['games']['Row']

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()

const tab = ref<'upcoming' | 'completed'>('upcoming')

const { data: upcoming } = await useAsyncData('upcoming-games', async () => {
  const { data } = await supabase
    .from('games')
    .select('*')
    .in('status', ['upcoming', 'team_formed', 'in_progress'])
    .order('played_at', { ascending: true })
  return data ?? []
})

const { data: completed } = await useAsyncData('completed-games', async () => {
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'completed')
    .order('played_at', { ascending: false })
  return data ?? []
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'uzc' ? 'uz' : 'uz-Latn', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
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

function gameLink(g: Game) {
  return localePath(`/games/${g.id}`)
}
</script>

<template>
  <div class="games-page">
    <h1 class="title">{{ t('games.title') }}</h1>

    <NTabs v-model:value="tab" type="line" animated>
      <NTabPane name="upcoming" :tab="t('games.upcoming')">
        <NEmpty v-if="!upcoming?.length" :description="t('games.no_upcoming')" />
        <div v-else class="games-grid">
          <NuxtLink
            v-for="g in upcoming"
            :key="g.id"
            :to="gameLink(g)"
            class="card-link"
          >
            <NCard hoverable size="small">
              <NSpace justify="space-between" align="center">
                <div>
                  <div class="game-date">{{ formatDate(g.played_at) }}</div>
                  <div v-if="g.location" class="muted small">{{ g.location }}</div>
                </div>
                <NTag round :type="statusColor[g.status]" size="small">
                  {{ t(`games.status.${g.status}`) }}
                </NTag>
              </NSpace>
            </NCard>
          </NuxtLink>
        </div>
      </NTabPane>

      <NTabPane name="completed" :tab="t('games.completed')">
        <NEmpty v-if="!completed?.length" :description="t('games.no_completed')" />
        <div v-else class="games-grid">
          <NuxtLink
            v-for="g in completed"
            :key="g.id"
            :to="gameLink(g)"
            class="card-link"
          >
            <NCard hoverable size="small">
              <NSpace justify="space-between" align="center">
                <div>
                  <div class="game-date">{{ formatDate(g.played_at) }}</div>
                  <div v-if="g.location" class="muted small">{{ g.location }}</div>
                </div>
                <NTag round type="success" size="small">
                  {{ t('games.status.completed') }}
                </NTag>
              </NSpace>
            </NCard>
          </NuxtLink>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.games-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.card-link {
  text-decoration: none;
  color: inherit;
}
.game-date {
  font-weight: 500;
}
.muted {
  opacity: 0.6;
}
.small {
  font-size: 13px;
}
</style>
