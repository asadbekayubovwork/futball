<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NAvatar,
  NTag,
  NSlider,
  NButton,
  NSpace,
  NInput,
  NIcon,
  NPopconfirm,
  useMessage,
} from 'naive-ui'
import { Search } from '@vicons/ionicons5'
import { h, type Component } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin'],
})

type Profile = Database['public']['Tables']['profiles']['Row']

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()
const message = useMessage()

const search = ref('')

const { data: players, refresh } = await useAsyncData('admin-players', async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  return data ?? []
})

const filtered = computed(() => {
  if (!players.value) return []
  if (!search.value) return players.value
  const s = search.value.toLowerCase()
  return players.value.filter((p) => p.full_name.toLowerCase().includes(s))
})

const savingSkill = ref<Record<string, boolean>>({})
const savingRole = ref<Record<string, boolean>>({})

async function updateSkill(player: Profile, value: number) {
  savingSkill.value[player.id] = true
  const { error } = await supabase
    .from('profiles')
    .update({ skill_rating: value })
    .eq('id', player.id)
  savingSkill.value[player.id] = false
  if (error) {
    message.error(error.message)
    return
  }
  message.success(t('admin.players.skill_updated'))
  await refresh()
}

async function toggleRole(player: Profile) {
  const newRole = player.role === 'admin' ? 'player' : 'admin'
  savingRole.value[player.id] = true
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', player.id)
  savingRole.value[player.id] = false
  if (error) {
    message.error(error.message)
    return
  }
  message.success(t('admin.players.role_updated'))
  await refresh()
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const columns = computed<DataTableColumns<Profile>>(() => [
  {
    title: t('profile.full_name'),
    key: 'full_name',
    render: (row) =>
      h('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
        h(
          NAvatar,
          {
            round: true,
            size: 32,
            src: row.photo_url ?? undefined,
            style: 'background:#16a34a;color:white;flex-shrink:0',
          },
          { default: () => initials(row.full_name) }
        ),
        h('div', null, [
          h('div', { style: 'font-weight:500' }, row.full_name),
          h('div', { style: 'opacity:.6;font-size:12px' }, row.phone ?? ''),
        ]),
      ]),
  },
  {
    title: t('profile.position'),
    key: 'position',
    width: 160,
    render: (row) =>
      row.position
        ? h(NTag, { round: true, size: 'small', type: 'success' }, { default: () => t(`profile.positions.${row.position}`) })
        : h('span', { style: 'opacity:.4' }, '—'),
  },
  {
    title: t('admin.players.title') + ' · ' + t('profile.skill_rating'),
    key: 'skill_rating',
    width: 280,
    render: (row) =>
      h('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
        h(NSlider, {
          value: row.skill_rating ?? 5,
          min: 1,
          max: 10,
          step: 1,
          marks: { 1: '1', 5: '5', 10: '10' },
          style: 'flex:1',
          'onUpdate:value': (v: number) => updateSkill(row, v),
          disabled: savingSkill.value[row.id],
        }),
        h('span', { style: 'min-width:32px;text-align:right;font-weight:600' }, `${row.skill_rating ?? 5}/10`),
      ]),
  },
  {
    title: t('profile.role'),
    key: 'role',
    width: 200,
    render: (row) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => toggleRole(row),
        },
        {
          trigger: () =>
            h(
              NButton,
              {
                size: 'small',
                type: row.role === 'admin' ? 'warning' : 'default',
                loading: savingRole.value[row.id],
              },
              {
                default: () =>
                  row.role === 'admin' ? t('admin.players.remove_admin') : t('admin.players.make_admin'),
              }
            ),
          default: () =>
            t('admin.players.confirm_role', {
              action: row.role === 'admin' ? t('admin.players.remove_admin') : t('admin.players.make_admin'),
            }),
        }
      ),
  },
])
</script>

<template>
  <div class="admin-players">
    <header>
      <h1 class="title">{{ t('admin.players.title') }}</h1>
    </header>

    <NSpace>
      <NInput
        v-model:value="search"
        :placeholder="t('players.search')"
        clearable
        style="width: 280px"
      >
        <template #prefix>
          <NIcon><Search /></NIcon>
        </template>
      </NInput>
    </NSpace>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="filtered"
        :bordered="false"
        size="medium"
      />
    </NCard>
  </div>
</template>

<style scoped>
.admin-players {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
</style>
