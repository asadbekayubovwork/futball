<script setup lang="ts">
import { NCard, NGrid, NGridItem, NIcon } from 'naive-ui'
import { People, Football } from '@vicons/ionicons5'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const localePath = useLocalePath()

const sections = computed(() => [
  {
    icon: People,
    title: t('admin.manage_players'),
    desc: t('admin.manage_players_desc'),
    to: localePath('/admin/players'),
  },
  {
    icon: Football,
    title: t('admin.manage_games'),
    desc: t('admin.manage_games_desc'),
    to: localePath('/admin/games'),
  },
])
</script>

<template>
  <div class="admin-page">
    <header class="head">
      <h1 class="title">{{ t('admin.title') }}</h1>
      <p class="muted">{{ t('admin.subtitle') }}</p>
    </header>

    <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGridItem v-for="s in sections" :key="s.to" span="2 m:1">
        <NuxtLink :to="s.to" class="card-link">
          <NCard hoverable class="section-card">
            <div class="section">
              <NIcon :size="32" color="#16a34a">
                <component :is="s.icon" />
              </NIcon>
              <div>
                <h3 class="section-title">{{ s.title }}</h3>
                <p class="muted small">{{ s.desc }}</p>
              </div>
            </div>
          </NCard>
        </NuxtLink>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.head {
  margin-bottom: 8px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
.muted {
  opacity: 0.6;
}
.small {
  font-size: 13px;
}
.card-link {
  text-decoration: none;
  color: inherit;
}
.section-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.15s;
}
.section-card:hover {
  transform: translateY(-2px);
}
.section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
</style>
