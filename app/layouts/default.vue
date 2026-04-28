<script setup lang="ts">
import {
  NConfigProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NNotificationProvider,
  darkTheme,
} from 'naive-ui'

const colorMode = useColorMode()

const naiveTheme = computed(() => (colorMode.value === 'dark' ? darkTheme : null))

const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#16a34a',
    primaryColorHover: '#22c55e',
    primaryColorPressed: '#15803d',
    primaryColorSuppl: '#16a34a',
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '8px',
  },
}))
</script>

<template>
  <NConfigProvider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
  >
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NNotificationProvider>
            <NLayout class="min-h-screen">
              <NLayoutHeader bordered class="header">
                <AppNavbar />
              </NLayoutHeader>
              <NLayoutContent class="content">
                <div class="container">
                  <slot />
                </div>
              </NLayoutContent>
            </NLayout>
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped>
.header {
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
}
.content {
  padding: 24px 0;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.min-h-screen {
  min-height: 100vh;
}
</style>
