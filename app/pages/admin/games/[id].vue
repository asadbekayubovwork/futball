<script setup lang="ts">
import {
  NCard,
  NSpin,
  NEmpty,
  NTag,
  NButton,
  NSpace,
  NSelect,
  NIcon,
  NPopconfirm,
  NAvatar,
  NDivider,
  useMessage,
} from 'naive-ui'
import { Trash, Refresh } from '@vicons/ionicons5'
import {
  snakeDraft,
  recommendedTeamCount,
  type DraftPlayer,
} from '~/utils/snakeDraft'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin'],
})

type Profile = Database['public']['Tables']['profiles']['Row']
type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']

const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()
const message = useMessage()

const gameId = computed(() => route.params.id as string)

const game = ref<Game | null>(null)
const registrations = ref<Profile[]>([])
const teams = ref<(Team & { players: Profile[] })[]>([])
const loading = ref(true)
const teamCount = ref<number>(2)
const generating = ref(false)
const deleting = ref(false)

async function loadAll() {
  loading.value = true
  const [gameRes, regRes, teamsRes] = await Promise.all([
    supabase.from('games').select('*').eq('id', gameId.value).maybeSingle(),
    supabase
      .from('registrations')
      .select('profile:profiles(*)')
      .eq('game_id', gameId.value)
      .eq('status', 'going'),
    supabase
      .from('teams')
      .select('*, team_players(player:profiles(*))')
      .eq('game_id', gameId.value),
  ])

  game.value = gameRes.data ?? null
  registrations.value = (regRes.data ?? [])
    .map((r: any) => r.profile)
    .filter(Boolean) as Profile[]

  teams.value = ((teamsRes.data as any[]) ?? []).map((t) => ({
    ...t,
    players: (t.team_players ?? [])
      .map((tp: any) => tp.player)
      .filter(Boolean) as Profile[],
  }))

  if (registrations.value.length > 0) {
    teamCount.value = recommendedTeamCount(registrations.value.length)
  }
  loading.value = false
}

await loadAll()

const teamOptions = computed(() => [
  { label: '2 ' + t('games.team_count', { count: 2 }).split(' ').slice(1).join(' '), value: 2 },
  { label: '3 ' + t('games.team_count', { count: 3 }).split(' ').slice(1).join(' '), value: 3 },
  { label: '4 ' + t('games.team_count', { count: 4 }).split(' ').slice(1).join(' '), value: 4 },
])

const minPlayers = computed(() => teamCount.value * 4)

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

async function generateTeams() {
  if (!game.value) return
  if (registrations.value.length < minPlayers.value) {
    message.error(t('games.manage.min_players', { min: minPlayers.value }))
    return
  }
  generating.value = true

  await supabase.from('teams').delete().eq('game_id', gameId.value)

  const draftPlayers: DraftPlayer[] = registrations.value.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    skill_rating: p.skill_rating ?? 5,
    position: p.position,
  }))

  const draft = snakeDraft(draftPlayers, teamCount.value)

  const { data: insertedTeams, error: teamsErr } = await supabase
    .from('teams')
    .insert(
      draft.map((dt) => ({
        game_id: gameId.value,
        name: dt.name,
        color: dt.color,
      }))
    )
    .select()

  if (teamsErr || !insertedTeams) {
    generating.value = false
    message.error(teamsErr?.message ?? t('auth.errors.generic'))
    return
  }

  const teamPlayerRows = insertedTeams.flatMap((team, idx) =>
    draft[idx].players.map((p) => ({
      team_id: team.id,
      player_id: p.id,
    }))
  )

  const { error: tpErr } = await supabase.from('team_players').insert(teamPlayerRows)
  if (tpErr) {
    generating.value = false
    message.error(tpErr.message)
    return
  }

  await supabase
    .from('games')
    .update({ status: 'team_formed' })
    .eq('id', gameId.value)

  generating.value = false
  message.success(t('games.manage.teams_formed'))
  await loadAll()
}

async function deleteGame() {
  if (!game.value) return
  deleting.value = true
  const { error } = await supabase.from('games').delete().eq('id', gameId.value)
  deleting.value = false
  if (error) {
    message.error(error.message)
    return
  }
  navigateTo(localePath('/admin/games'))
}

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  upcoming: 'info',
  team_formed: 'warning',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const swapMode = ref(false)
const selectedPlayer = ref<{ playerId: string; teamId: string } | null>(null)

async function handleSwapClick(playerId: string, teamId: string) {
  if (!swapMode.value) return
  if (!selectedPlayer.value) {
    selectedPlayer.value = { playerId, teamId }
    return
  }
  if (selectedPlayer.value.playerId === playerId) {
    selectedPlayer.value = null
    return
  }
  if (selectedPlayer.value.teamId === teamId) {
    selectedPlayer.value = { playerId, teamId }
    return
  }
  const a = selectedPlayer.value
  const b = { playerId, teamId }
  selectedPlayer.value = null

  await Promise.all([
    supabase.from('team_players').delete().eq('player_id', a.playerId).eq('team_id', a.teamId),
    supabase.from('team_players').delete().eq('player_id', b.playerId).eq('team_id', b.teamId),
  ])
  await supabase.from('team_players').insert([
    { team_id: b.teamId, player_id: a.playerId },
    { team_id: a.teamId, player_id: b.playerId },
  ])

  await loadAll()
}
</script>

<template>
  <div class="admin-game">
    <NSpace align="center" :size="12">
      <NButton text @click="navigateTo(localePath('/admin/games'))">
        ← {{ t('games.create.back') }}
      </NButton>
    </NSpace>

    <div v-if="loading" class="center"><NSpin /></div>
    <NEmpty v-else-if="!game" description="O'yin topilmadi" />
    <template v-else>
      <NCard>
        <div class="game-head">
          <div>
            <h1 class="title">{{ formatDate(game.played_at) }}</h1>
            <p v-if="game.location" class="muted">{{ game.location }}</p>
          </div>
          <NSpace>
            <NTag round :type="statusColor[game.status]">
              {{ t(`games.status.${game.status}`) }}
            </NTag>
            <NPopconfirm @positive-click="deleteGame">
              <template #trigger>
                <NButton size="small" :loading="deleting">
                  <template #icon><NIcon><Trash /></NIcon></template>
                  {{ t('games.manage.delete_game') }}
                </NButton>
              </template>
              {{ t('games.manage.delete_confirm') }}
            </NPopconfirm>
          </NSpace>
        </div>
      </NCard>

      <NCard :title="t('games.manage.registered') + ` (${registrations.length})`">
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
            <span class="reg-skill">{{ p.skill_rating ?? 5 }}/10</span>
          </div>
        </div>
      </NCard>

      <NCard :title="teams.length ? t('games.manage.regenerate') : t('games.manage.form_teams')">
        <NSpace align="center" :wrap="true">
          <NSelect
            v-model:value="teamCount"
            :options="teamOptions"
            style="width: 180px"
            :placeholder="t('games.manage.team_count_label')"
          />
          <NButton
            type="primary"
            :loading="generating"
            :disabled="registrations.length < minPlayers"
            @click="generateTeams"
          >
            <template #icon><NIcon><Refresh /></NIcon></template>
            {{ teams.length ? t('games.manage.regenerate') : t('games.manage.form_teams') }}
          </NButton>
          <span v-if="registrations.length < minPlayers" class="muted small">
            {{ t('games.manage.min_players', { min: minPlayers }) }}
          </span>
        </NSpace>

        <template v-if="teams.length">
          <NDivider />
          <NSpace align="center">
            <NButton
              :type="swapMode ? 'warning' : 'default'"
              size="small"
              @click="swapMode = !swapMode; selectedPlayer = null"
            >
              {{ swapMode ? t('common.cancel') : t('games.manage.swap_player') }}
            </NButton>
            <span v-if="swapMode && !selectedPlayer" class="muted small">
              {{ t('games.manage.select_player') }}
            </span>
          </NSpace>

          <div class="teams-grid">
            <NCard
              v-for="team in teams"
              :key="team.id"
              size="small"
              class="team-card"
              :style="{ borderTop: `4px solid ${team.color || '#16a34a'}` }"
            >
              <template #header>
                <div class="team-header">
                  <span class="team-name" :style="{ color: team.color || undefined }">
                    {{ team.name }}
                  </span>
                  <span class="muted small">
                    {{ team.players.length }} · Σ
                    {{ team.players.reduce((s, p) => s + (p.skill_rating ?? 5), 0) }}
                  </span>
                </div>
              </template>
              <div
                v-for="p in team.players"
                :key="p.id"
                class="team-player"
                :class="{
                  swappable: swapMode,
                  selected:
                    selectedPlayer?.playerId === p.id &&
                    selectedPlayer?.teamId === team.id,
                }"
                @click="handleSwapClick(p.id, team.id)"
              >
                <NAvatar
                  round
                  :size="28"
                  :src="p.photo_url || undefined"
                  :style="{ background: '#16a34a', color: 'white' }"
                >
                  {{ initials(p.full_name) }}
                </NAvatar>
                <span class="tp-name">{{ p.full_name }}</span>
                <span class="tp-skill">{{ p.skill_rating ?? 5 }}</span>
              </div>
            </NCard>
          </div>
        </template>
      </NCard>
    </template>
  </div>
</template>

<style scoped>
.admin-game {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.game-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}
.muted {
  opacity: 0.6;
}
.small {
  font-size: 13px;
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
.reg-skill {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 500;
}
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.team-card {
  height: 100%;
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
  border-radius: 6px;
  transition: background 0.1s;
}
.swappable {
  cursor: pointer;
}
.swappable:hover {
  background: rgba(22, 163, 74, 0.08);
}
.selected {
  background: rgba(245, 158, 11, 0.18) !important;
  outline: 2px solid #f59e0b;
}
.tp-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tp-skill {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
}
</style>
