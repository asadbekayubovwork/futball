<script setup lang="ts">
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NTag,
  NSpace,
  NSpin,
  NRate,
  useMessage,
} from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const message = useMessage()
const { profile, loading, load, isAdmin } = useProfile()

const form = reactive({
  full_name: '',
  position: null as string | null,
  photo_url: '',
})

watchEffect(() => {
  if (profile.value) {
    form.full_name = profile.value.full_name
    form.position = profile.value.position
    form.photo_url = profile.value.photo_url ?? ''
  }
})

const positionOptions = computed(() => [
  { label: t('profile.positions.GK'), value: 'GK' },
  { label: t('profile.positions.DEF'), value: 'DEF' },
  { label: t('profile.positions.MID'), value: 'MID' },
  { label: t('profile.positions.FWD'), value: 'FWD' },
])

const saving = ref(false)

async function save() {
  if (!user.value) return
  saving.value = true
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: form.full_name.trim(),
      position: form.position as Database['public']['Tables']['profiles']['Row']['position'],
      photo_url: form.photo_url.trim() || null,
    })
    .eq('id', user.value.id)
  saving.value = false
  if (error) {
    message.error(t('profile.save_error'))
    return
  }
  message.success(t('profile.saved'))
  await load()
}
</script>

<template>
  <div class="profile-page">
    <NCard :title="t('profile.title')">
      <div v-if="loading && !profile" class="center">
        <NSpin />
      </div>

      <NForm v-else-if="profile" @submit.prevent="save">
        <NSpace vertical :size="4" class="header-info">
          <NSpace :size="8">
            <NTag :type="isAdmin ? 'warning' : 'default'" round>
              {{ isAdmin ? t('profile.roles.admin') : t('profile.roles.player') }}
            </NTag>
          </NSpace>
          <p class="muted small">{{ user?.email || user?.phone }}</p>
        </NSpace>

        <NFormItem :label="t('profile.full_name')">
          <NInput v-model:value="form.full_name" size="large" />
        </NFormItem>

        <NFormItem :label="t('profile.position')">
          <NSelect
            v-model:value="form.position"
            :options="positionOptions"
            size="large"
            clearable
          />
        </NFormItem>

        <NFormItem :label="t('profile.photo_url')">
          <NInput
            v-model:value="form.photo_url"
            placeholder="https://..."
            size="large"
          />
        </NFormItem>

        <NFormItem :label="t('profile.skill_rating')">
          <NSpace align="center" :size="12">
            <NRate readonly :default-value="profile.skill_rating ?? 5" :count="10" />
            <span class="muted small">{{ profile.skill_rating ?? 5 }}/10 · {{ t('profile.skill_locked') }}</span>
          </NSpace>
        </NFormItem>

        <NButton
          type="primary"
          size="large"
          :loading="saving"
          attr-type="submit"
          @click="save"
        >
          {{ t('profile.save') }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.header-info {
  margin-bottom: 16px;
}
.muted {
  opacity: 0.65;
}
.small {
  font-size: 13px;
}
</style>
