<script setup lang="ts">
import { NCard, NAvatar, NTag, NSpace } from 'naive-ui'
import type { Database } from '~/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const props = defineProps<{ player: Profile; clickable?: boolean }>()

const { t } = useI18n()
const localePath = useLocalePath()

const initials = computed(() =>
  props.player.full_name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
)

const positionColor: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  GK: 'warning',
  DEF: 'info',
  MID: 'success',
  FWD: 'error',
}

const skillStars = computed(() => {
  const r = props.player.skill_rating ?? 5
  return '★'.repeat(Math.round(r / 2)) + '☆'.repeat(5 - Math.round(r / 2))
})
</script>

<template>
  <component
    :is="clickable ? 'NuxtLink' : 'div'"
    :to="clickable ? localePath(`/players/${player.id}`) : undefined"
    class="card-link"
  >
    <NCard size="small" hoverable :class="{ clickable }">
      <div class="row">
        <NAvatar
          round
          :size="48"
          :src="player.photo_url || undefined"
          :style="{ background: '#16a34a', color: 'white', flexShrink: 0 }"
        >
          {{ initials }}
        </NAvatar>
        <div class="info">
          <div class="name">{{ player.full_name }}</div>
          <NSpace :size="6" class="meta">
            <NTag
              v-if="player.position"
              size="small"
              :type="positionColor[player.position] ?? 'default'"
              round
            >
              {{ t(`profile.positions.${player.position}`) }}
            </NTag>
            <NTag v-if="player.role === 'admin'" size="small" type="warning" round>
              {{ t('profile.roles.admin') }}
            </NTag>
          </NSpace>
        </div>
        <div class="skill">
          <span class="stars">{{ skillStars }}</span>
          <span class="skill-num">{{ player.skill_rating ?? 5 }}/10</span>
        </div>
      </div>
    </NCard>
  </component>
</template>

<style scoped>
.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
.clickable {
  cursor: pointer;
  transition: transform 0.15s;
}
.clickable:hover {
  transform: translateY(-2px);
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  margin-top: 4px;
}
.skill {
  text-align: right;
  flex-shrink: 0;
}
.stars {
  color: #f59e0b;
  font-size: 13px;
  letter-spacing: 1px;
}
.skill-num {
  display: block;
  font-size: 12px;
  opacity: 0.6;
  margin-top: 2px;
}
</style>
