<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui'

definePageMeta({ layout: 'default', middleware: ['auth'] })
const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="title">{{ t('nav.stats') }}</h1>
    <NCard>
      <NEmpty description="Statistika sahifasi tez orada" />
    </NCard>
  </div>
</template>

<style scoped>
.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px;
}
</style>
