<script setup lang="ts">
import {
  NCard,
  NForm,
  NFormItem,
  NDatePicker,
  NInput,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const message = useMessage()

const form = reactive({
  played_at: nextFridayAt19().getTime(),
  location: '',
  notes: '',
})

function nextFridayAt19() {
  const d = new Date()
  const offset = (5 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + offset)
  d.setHours(19, 0, 0, 0)
  return d
}

const submitting = ref(false)

async function submit() {
  if (!user.value) return
  if (!form.played_at) {
    message.error(t('auth.errors.generic'))
    return
  }
  submitting.value = true
  const { data, error } = await supabase
    .from('games')
    .insert({
      played_at: new Date(form.played_at).toISOString(),
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: 'upcoming',
      created_by: user.value.id,
    })
    .select()
    .single()
  submitting.value = false
  if (error || !data) {
    message.error(error?.message ?? t('auth.errors.generic'))
    return
  }
  message.success(t('games.create.created'))
  navigateTo(localePath(`/admin/games/${data.id}`))
}
</script>

<template>
  <div class="new-game-page">
    <NSpace align="center" :size="12">
      <NButton text @click="navigateTo(localePath('/admin/games'))">
        ← {{ t('games.create.back') }}
      </NButton>
    </NSpace>

    <NCard :title="t('games.create.title')" class="card">
      <NForm @submit.prevent="submit">
        <NFormItem :label="t('games.create.date')">
          <NDatePicker
            v-model:value="form.played_at"
            type="datetime"
            clearable
            size="large"
            style="width: 100%"
            :first-day-of-week="0"
          />
        </NFormItem>
        <NFormItem :label="t('games.create.location')">
          <NInput
            v-model:value="form.location"
            :placeholder="t('games.create.location_placeholder')"
            size="large"
          />
        </NFormItem>
        <NFormItem :label="t('games.create.notes')">
          <NInput
            v-model:value="form.notes"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        <NButton
          type="primary"
          size="large"
          block
          :loading="submitting"
          attr-type="submit"
          @click="submit"
        >
          {{ t('games.create.submit') }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.new-game-page {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  margin-top: 8px;
}
</style>
