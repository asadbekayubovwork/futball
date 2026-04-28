<script setup lang="ts">
import { NSpin } from 'naive-ui'

definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const localePath = useLocalePath()

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    navigateTo(localePath('/'), { replace: true })
  } else {
    navigateTo(localePath('/login'), { replace: true })
  }
})
</script>

<template>
  <div class="callback">
    <NSpin size="large" />
    <p class="muted">Kirilmoqda...</p>
  </div>
</template>

<style scoped>
.callback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}
.muted {
  opacity: 0.65;
}
</style>
