<script setup lang="ts">
import {
  NCard,
  NSpace,
  NButton,
  NTag,
  NStatistic,
  NGrid,
  NGridItem,
  NEmpty,
  NIcon,
  NSpin,
  useMessage,
} from 'naive-ui'
import { Football, Calendar, People } from '@vicons/ionicons5'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const message = useMessage()

const loading = ref(true)
const updating = ref(false)
const nextGame = ref<Database['public']['Tables']['games']['Row'] | null>(null)
const registeredCount = ref(0)
const myRegistered = ref(false)

async function loadHome() {
  loading.value = true
  const { data: gameData } = await supabase
    .from('games')
    .select('*')
    .in('status', ['upcoming', 'team_formed'])
    .gte('played_at', new Date().toISOString())
    .order('played_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  nextGame.value = gameData ?? null

  if (gameData) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('player_id')
      .eq('game_id', gameData.id)
      .eq('status', 'going')
    registeredCount.value = regs?.length ?? 0
    myRegistered.value = !!user.value && !!regs?.some((r) => r.player_id === user.value?.id)
  } else {
    registeredCount.value = 0
    myRegistered.value = false
  }
  loading.value = false
}

await loadHome()
watch(user, loadHome)

async function toggleRegistration() {
  if (!user.value) {
    navigateTo(localePath('/login'))
    return
  }
  if (!nextGame.value) return
  updating.value = true
  if (myRegistered.value) {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('game_id', nextGame.value.id)
      .eq('player_id', user.value.id)
    if (error) message.error(error.message)
  } else {
    const { error } = await supabase.from('registrations').upsert(
      {
        game_id: nextGame.value.id,
        player_id: user.value.id,
        status: 'going',
      },
      { onConflict: 'game_id,player_id' }
    )
    if (error) message.error(error.message)
  }
  await loadHome()
  updating.value = false
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'uzc' ? 'uz' : 'uz-Latn', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'uzc' ? 'uz' : 'uz-Latn', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero-title">{{ t('brand.name') }}</h1>
      <p class="hero-subtitle">{{ t('brand.tagline') }}</p>
    </section>

    <div v-if="loading" class="center"><NSpin /></div>

    <NCard v-else-if="!nextGame">
      <NEmpty :description="t('games.no_upcoming')" />
    </NCard>

    <template v-else>
      <NGrid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <NGridItem span="3 m:1">
          <NCard size="small">
            <NStatistic :label="t('home.next_game')" :value="formatDate(nextGame.played_at)">
              <template #prefix>
                <NIcon :size="20" color="#16a34a"><Calendar /></NIcon>
              </template>
              <template #suffix>
                <span class="time">· {{ formatTime(nextGame.played_at) }}</span>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem span="3 m:1">
          <NCard size="small">
            <NStatistic
              :label="t('home.registered_players')"
              :value="String(registeredCount)"
            >
              <template #prefix>
                <NIcon :size="20" color="#16a34a"><People /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem span="3 m:1">
          <NCard size="small">
            <NStatistic label="Format" value="6v6">
              <template #prefix>
                <NIcon :size="20" color="#16a34a"><Football /></NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <NCard
        :title="nextGame.location ?? formatDate(nextGame.played_at)"
        class="join-card"
      >
        <template #header-extra>
          <ClientOnly>
            <NTag :type="myRegistered ? 'success' : 'default'" round>
              {{ myRegistered ? t('games.you_going') : t(`games.status.${nextGame.status}`) }}
            </NTag>
          </ClientOnly>
        </template>
        <p class="muted">
          {{ formatDate(nextGame.played_at) }} · {{ formatTime(nextGame.played_at) }}
        </p>
        <NSpace>
          <ClientOnly>
            <NButton
              :type="myRegistered ? 'default' : 'primary'"
              size="large"
              :loading="updating"
              @click="toggleRegistration"
            >
              {{ myRegistered ? t('games.not_going') : t('games.going') }}
            </NButton>
            <template #fallback>
              <NButton type="primary" size="large" disabled>
                {{ t('games.going') }}
              </NButton>
            </template>
          </ClientOnly>
          <NButton
            size="large"
            quaternary
            @click="navigateTo(localePath(`/games/${nextGame.id}`))"
          >
            Batafsil →
          </NButton>
        </NSpace>
      </NCard>
    </template>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.hero {
  text-align: center;
  padding: 32px 0 16px;
}
.hero-title {
  font-size: 40px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  margin: 8px 0 0;
  opacity: 0.7;
  font-size: 16px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.join-card {
  border-left: 4px solid #16a34a;
}
.muted {
  opacity: 0.65;
  margin: 0 0 16px;
}
.time {
  opacity: 0.6;
  font-size: 14px;
  margin-left: 6px;
}
@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }
}
</style>
