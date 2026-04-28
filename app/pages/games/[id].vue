<script setup lang="ts">
import {
  NCard,
  NSpin,
  NEmpty,
  NTag,
  NButton,
  NSpace,
  NAvatar,
  NDivider,
  useMessage,
} from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', middleware: ['auth'] })

type Profile = Database['public']['Tables']['profiles']['Row']
type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']

const { t, locale } = useI18n()
const route = useRoute()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const message = useMessage()

const gameId = computed(() => route.params.id as string)

const game = ref<Game | null>(null)
const registrations = ref<Profile[]>([])
const teams = ref<(Team & { players: Profile[] })[]>([])
const myRegistered = ref(false)
const loading = ref(true)
const updating = ref(false)

async function loadAll() {
  loading.value = true
  const [gameRes, regRes, teamsRes] = await Promise.all([
    supabase.from('games').select('*').eq('id', gameId.value).maybeSingle(),
    supabase
      .from('registrations')
      .select('player_id, profile:profiles(*)')
      .eq('game_id', gameId.value)
      .eq('status', 'going'),
    supabase
      .from('teams')
      .select('*, team_players(player:profiles(*))')
      .eq('game_id', gameId.value),
  ])

  game.value = gameRes.data ?? null

  const regs = (regRes.data ?? []) as any[]
  registrations.value = regs.map((r) => r.profile).filter(Boolean) as Profile[]
  myRegistered.value = !!user.value && regs.some((r) => r.player_id === user.value?.id)

  teams.value = ((teamsRes.data as any[]) ?? []).map((t) => ({
    ...t,
    players: (t.team_players ?? []).map((tp: any) => tp.player).filter(Boolean) as Profile[],
  }))

  loading.value = false
}

await loadAll()

async function toggleRegistration() {
  if (!user.value || !game.value) return
  updating.value = true
  if (myRegistered.value) {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('game_id', gameId.value)
      .eq('player_id', user.value.id)
    if (error) message.error(error.message)
  } else {
    const { error } = await supabase.from('registrations').upsert(
      {
        game_id: gameId.value,
        player_id: user.value.id,
        status: 'going',
      },
      { onConflict: 'game_id,player_id' }
    )
    if (error) message.error(error.message)
  }
  await loadAll()
  updating.value = false
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'uzc' ? 'uz' : 'uz-Latn', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  upcoming: 'info',
  team_formed: 'warning',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const isUpcoming = computed(() => game.value && ['upcoming', 'team_formed'].includes(game.value.status))
</script>

<template>
  <div class="game-page">
    <div v-if="loading" class="center"><NSpin /></div>
    <NEmpty v-else-if="!game" description="O'yin topilmadi" />
    <template v-else>
      <NCard>
        <div class="head">
          <div>
            <h1 class="title">{{ formatDate(game.played_at) }}</h1>
            <p v-if="game.location" class="muted">{{ game.location }}</p>
          </div>
          <NTag round :type="statusColor[game.status]">
            {{ t(`games.status.${game.status}`) }}
          </NTag>
        </div>

        <NDivider />

        <NSpace align="center" :size="16">
          <NButton
            v-if="isUpcoming"
            :type="myRegistered ? 'default' : 'primary'"
            size="large"
            :loading="updating"
            @click="toggleRegistration"
          >
            {{ myRegistered ? t('games.not_going') : t('games.going') }}
          </NButton>
          <span class="muted">
            {{ t('games.registered_count', { count: registrations.length }) }}
            <template v-if="myRegistered"> · ✓ {{ t('games.you_going') }}</template>
          </span>
        </NSpace>
      </NCard>

      <NCard v-if="teams.length" :title="t('games.team_count', { count: teams.length })">
        <div class="teams-grid">
          <NCard
            v-for="team in teams"
            :key="team.id"
            size="small"
            :style="{ borderTop: `4px solid ${team.color || '#16a34a'}` }"
          >
            <template #header>
              <div class="team-header">
                <span class="team-name" :style="{ color: team.color || undefined }">
                  {{ team.name }}
                </span>
                <span class="muted small">{{ team.players.length }}</span>
              </div>
            </template>
            <div v-for="p in team.players" :key="p.id" class="team-player">
              <NAvatar
                round
                :size="28"
                :src="p.photo_url || undefined"
                :style="{ background: '#16a34a', color: 'white' }"
              >
                {{ initials(p.full_name) }}
              </NAvatar>
              <span class="tp-name">{{ p.full_name }}</span>
            </div>
          </NCard>
        </div>
      </NCard>

      <NCard
        v-else
        :title="t('games.manage.registered') + ` (${registrations.length})`"
      >
        <NEmpty v-if="!registrations.length" :description="t('games.manage.no_registrations')" />
        <div v-else class="registrations-grid">
          <div v-for="p in registrations" :key="p.id" class="reg-row">
            <NAvatar
              round
              :size="32"
              :src="p.photo_url || undefined"
              :style="{ background: '#16a34a', color: 'white' }"
            >
              {{ initials(p.full_name) }}
            </NAvatar>
            <span class="reg-name">{{ p.full_name }}</span>
          </div>
        </div>
      </NCard>
    </template>
  </div>
</template>

<style scoped>
.game-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}
.muted {
  opacity: 0.65;
}
.small {
  font-size: 13px;
}
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.team-name {
  font-weight: 700;
  font-size: 16px;
}
.team-player {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
}
.tp-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.registrations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.reg-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reg-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
