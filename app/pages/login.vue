<script setup lang="ts">
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NFormItem,
  NTabs,
  NTabPane,
  NDivider,
  NIcon,
  useMessage,
} from 'naive-ui'
import { LogoGoogle } from '@vicons/ionicons5'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const message = useMessage()
const route = useRoute()

watchEffect(() => {
  if (user.value) {
    const redirect = (route.query.redirect as string) || '/'
    navigateTo(redirect.startsWith('/') ? redirect : localePath('/'))
  }
})

const tab = ref<'email' | 'phone'>('email')
const loading = ref(false)

const emailForm = reactive({ email: '', password: '' })
const phoneForm = reactive({ phone: '', password: '' })

async function loginWithGoogle() {
  loading.value = true
  const redirectTo = `${window.location.origin}${localePath('/auth/callback')}`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) {
    message.error(error.message || t('auth.errors.generic'))
    loading.value = false
  }
}

function postLoginRedirect() {
  const redirect = (route.query.redirect as string) || '/'
  return redirect.startsWith('/') ? redirect : localePath('/')
}

async function loginWithEmail() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: emailForm.email.trim(),
    password: emailForm.password,
  })
  loading.value = false
  if (error) {
    message.error(t('auth.errors.invalid_credentials'))
    return
  }
  navigateTo(postLoginRedirect())
}

async function loginWithPhone() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    phone: phoneForm.phone.replace(/\s+/g, ''),
    password: phoneForm.password,
  })
  loading.value = false
  if (error) {
    message.error(t('auth.errors.invalid_credentials'))
    return
  }
  navigateTo(postLoginRedirect())
}
</script>

<template>
  <div class="auth-wrap">
    <NCard :title="t('auth.login_title')" class="auth-card">
      <NButton
        block
        size="large"
        :loading="loading"
        class="google-btn"
        @click="loginWithGoogle"
      >
        <template #icon>
          <NIcon><LogoGoogle /></NIcon>
        </template>
        {{ t('auth.login_with_google') }}
      </NButton>

      <NDivider>{{ t('auth.or') }}</NDivider>

      <NTabs v-model:value="tab" type="segment" animated>
        <NTabPane name="email" :tab="t('auth.login_with_email')">
          <NForm @submit.prevent="loginWithEmail">
            <NFormItem :label="t('auth.email')">
              <NInput
                v-model:value="emailForm.email"
                type="text"
                placeholder="you@webase.uz"
                size="large"
              />
            </NFormItem>
            <NFormItem :label="t('auth.password')">
              <NInput
                v-model:value="emailForm.password"
                type="password"
                show-password-on="click"
                size="large"
              />
            </NFormItem>
            <NButton
              type="primary"
              size="large"
              block
              :loading="loading"
              attr-type="submit"
              @click="loginWithEmail"
            >
              {{ t('auth.submit_login') }}
            </NButton>
          </NForm>
        </NTabPane>

        <NTabPane name="phone" :tab="t('auth.login_with_phone')">
          <NForm @submit.prevent="loginWithPhone">
            <NFormItem :label="t('auth.phone')">
              <NInput
                v-model:value="phoneForm.phone"
                type="text"
                :placeholder="t('auth.phone_placeholder')"
                size="large"
              />
            </NFormItem>
            <NFormItem :label="t('auth.password')">
              <NInput
                v-model:value="phoneForm.password"
                type="password"
                show-password-on="click"
                size="large"
              />
            </NFormItem>
            <NButton
              type="primary"
              size="large"
              block
              :loading="loading"
              attr-type="submit"
              @click="loginWithPhone"
            >
              {{ t('auth.submit_login') }}
            </NButton>
          </NForm>
        </NTabPane>
      </NTabs>

      <p class="muted center">
        {{ t('auth.no_account') }}
        <NuxtLink :to="localePath('/register')" class="link">
          {{ t('auth.submit_register') }}
        </NuxtLink>
      </p>
    </NCard>
  </div>
</template>

<style scoped>
.auth-wrap {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.auth-card {
  width: 100%;
  max-width: 420px;
}
.google-btn {
  font-weight: 500;
}
.muted {
  opacity: 0.65;
  font-size: 14px;
  margin: 16px 0 0;
}
.center {
  text-align: center;
}
.link {
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}
</style>
