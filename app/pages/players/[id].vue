<script setup lang="ts">
import {
  NCard,
  NAvatar,
  NTag,
  NSpace,
  NRate,
  NSpin,
  NEmpty,
  NStatistic,
  NGrid,
  NGridItem,
} from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const route = useRoute()
const supabase = useSupabaseClient<Database>()

const playerId = computed(() => route.params.id as string)

const { data: player, pending } = await useAsyncData(
  () => `player-${playerId.value}`,
  async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId.value)
      .maybeSingle()
    return data
  }
)

const { data: stats } = await useAsyncData(
  () => `player-stats-${playerId.value}`,
  async () => {
    const { data } = await supabase
      .from('player_stats')
      .select('goals, assists, is_mvp')
      .eq('player_id', playerId.value)
    if (!data) return { goals: 0, assists: 0, mvp: 0, matches: 0 }
    return {
      goals: data.reduce((s, r) => s + (r.goals ?? 0), 0),
      assists: data.reduce((s, r) => s + (r.assists ?? 0), 0),
      mvp: data.filter((r) => r.is_mvp).length,
      matches: data.length,
    }
  }
)

const initials = computed(() => {
  if (!player.value) return '?'
  return player.value.full_name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <div class="player-page">
    <div v-if="pending" class="center">
      <NSpin />
    </div>
    <NEmpty v-else-if="!player" description="O'yinchi topilmadi" />
    <template v-else>
      <NCard>
        <div class="header">
          <NAvatar
            round
            :size="96"
            :src="player.photo_url || undefined"
            :style="{ background: '#16a34a', color: 'white', fontSize: '32px' }"
          >
            {{ initials }}
          </NAvatar>
          <div class="info">
            <h1 class="name">{{ player.full_name }}</h1>
            <NSpace :size="6">
              <NTag v-if="player.position" round type="success">
                {{ t(`profile.positions.${player.position}`) }}
              </NTag>
              <NTag v-else round>{{ t('players.no_position') }}</NTag>
              <NTag v-if="player.role === 'admin'" round type="warning">
                {{ t('profile.roles.admin') }}
              </NTag>
            </NSpace>
            <div class="rating">
              <NRate readonly :default-value="player.skill_rating ?? 5" :count="10" />
              <span class="muted">{{ player.skill_rating ?? 5 }}/10</span>
            </div>
          </div>
        </div>
      </NCard>

      <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
        <NGridItem span="2 m:1">
          <NCard size="small">
            <NStatistic label="O'yinlar" :value="stats?.matches ?? 0" />
          </NCard>
        </NGridItem>
        <NGridItem span="2 m:1">
          <NCard size="small">
            <NStatistic label="Gollar" :value="stats?.goals ?? 0" />
          </NCard>
        </NGridItem>
        <NGridItem span="2 m:1">
          <NCard size="small">
            <NStatistic label="Asistlar" :value="stats?.assists ?? 0" />
          </NCard>
        </NGridItem>
        <NGridItem span="2 m:1">
          <NCard size="small">
            <NStatistic label="MVP" :value="stats?.mvp ?? 0" />
          </NCard>
        </NGridItem>
      </NGrid>
    </template>
  </div>
</template>

<style scoped>
.player-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.header {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}
.info {
  flex: 1;
  min-width: 200px;
}
.name {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
}
.rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.muted {
  opacity: 0.6;
  font-size: 14px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
</style>
