<script setup lang="ts">
import { NButton, NDropdown, NIcon, NSpace, NAvatar } from 'naive-ui'
import { Moon, Sunny, Desktop, Globe, LogIn, Person, LogOut, Settings } from '@vicons/ionicons5'
import { h } from 'vue'

const { t, locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()
const localePath = useLocalePath()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, isAdmin } = useProfile()

const themeOptions = computed(() => [
  { label: t('common.theme_light'), key: 'light', icon: () => h(NIcon, null, { default: () => h(Sunny) }) },
  { label: t('common.theme_dark'), key: 'dark', icon: () => h(NIcon, null, { default: () => h(Moon) }) },
  { label: t('common.theme_system'), key: 'system', icon: () => h(NIcon, null, { default: () => h(Desktop) }) },
])

const localeOptions = computed(() =>
  (locales.value as { code: string; name: string }[]).map((l) => ({
    label: l.name,
    key: l.code,
  }))
)

const navLinks = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.players'), to: localePath('/players') },
  { label: t('nav.games'), to: localePath('/games') },
  { label: t('nav.stats'), to: localePath('/stats') },
])

const userMenuOptions = computed(() => {
  const base = [
    {
      label: t('nav.profile'),
      key: 'profile',
      icon: () => h(NIcon, null, { default: () => h(Person) }),
    },
  ]
  if (isAdmin.value) {
    base.push({
      label: t('nav.admin'),
      key: 'admin',
      icon: () => h(NIcon, null, { default: () => h(Settings) }),
    })
  }
  base.push({
    label: t('auth.logout'),
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOut) }),
  })
  return base
})

function handleTheme(key: string) {
  colorMode.preference = key
}

function handleLocale(key: string) {
  setLocale(key as 'uz' | 'uzc')
}

async function handleUserMenu(key: string) {
  if (key === 'profile') {
    navigateTo(localePath('/profile'))
  } else if (key === 'admin') {
    navigateTo(localePath('/admin'))
  } else if (key === 'logout') {
    await supabase.auth.signOut()
    navigateTo(localePath('/'))
  }
}

const currentThemeIcon = computed(() => {
  if (colorMode.preference === 'dark') return Moon
  if (colorMode.preference === 'light') return Sunny
  return Desktop
})

const userInitials = computed(() => {
  const name = profile.value?.full_name ?? user.value?.email ?? user.value?.phone ?? '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <div class="navbar">
    <NuxtLink :to="localePath('/')" class="brand">
      <AppLogo :size="32" />
    </NuxtLink>

    <nav class="links">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="link"
        active-class="link-active"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <NSpace :size="8" align="center">
      <NDropdown
        :options="localeOptions"
        trigger="click"
        @select="handleLocale"
      >
        <NButton quaternary circle>
          <template #icon>
            <NIcon><Globe /></NIcon>
          </template>
        </NButton>
      </NDropdown>

      <NDropdown
        :options="themeOptions"
        trigger="click"
        @select="handleTheme"
      >
        <NButton quaternary circle>
          <template #icon>
            <NIcon><component :is="currentThemeIcon" /></NIcon>
          </template>
        </NButton>
      </NDropdown>

      <ClientOnly>
        <NDropdown
          v-if="user"
          :options="userMenuOptions"
          trigger="click"
          @select="handleUserMenu"
        >
          <NAvatar
            round
            :src="profile?.photo_url || undefined"
            :style="{ background: '#16a34a', color: 'white', cursor: 'pointer' }"
          >
            {{ userInitials }}
          </NAvatar>
        </NDropdown>

        <NButton
          v-else
          type="primary"
          @click="navigateTo(localePath('/login'))"
        >
          <template #icon>
            <NIcon><LogIn /></NIcon>
          </template>
          {{ t('nav.login') }}
        </NButton>

        <template #fallback>
          <div class="auth-placeholder" />
        </template>
      </ClientOnly>
    </NSpace>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 24px;
}
.brand {
  text-decoration: none;
  color: inherit;
}
.links {
  display: flex;
  gap: 24px;
  flex: 1;
  margin-left: 32px;
}
.link {
  text-decoration: none;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.15s;
  font-weight: 500;
}
.link:hover {
  opacity: 1;
}
.link-active {
  opacity: 1;
  color: #16a34a;
}
@media (max-width: 768px) {
  .links {
    display: none;
  }
}
.auth-placeholder {
  width: 96px;
  height: 34px;
}
</style>
