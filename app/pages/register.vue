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

watchEffect(() => {
  if (user.value) {
    navigateTo(localePath('/'))
  }
})

const tab = ref<'email' | 'phone'>('email')
const loading = ref(false)

const emailForm = reactive({ full_name: '', email: '', password: '' })
const phoneForm = reactive({ full_name: '', phone: '', password: '' })

async function registerWithGoogle() {
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

async function registerWithEmail() {
  if (emailForm.password.length < 8) {
    message.error(t('auth.errors.weak_password'))
    return
  }
  loading.value = true
  const { error } = await supabase.auth.signUp({
    email: emailForm.email.trim(),
    password: emailForm.password,
    options: {
      data: { full_name: emailForm.full_name.trim() },
    },
  })
  loading.value = false
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      message.error(t('auth.errors.user_exists'))
    } else {
      message.error(error.message)
    }
    return
  }
  message.success(t('auth.success_register'))
  navigateTo(localePath('/'))
}

async function registerWithPhone() {
  if (phoneForm.password.length < 8) {
    message.error(t('auth.errors.weak_password'))
    return
  }
  loading.value = true
  const { error } = await supabase.auth.signUp({
    phone: phoneForm.phone.replace(/\s+/g, ''),
    password: phoneForm.password,
    options: {
      data: { full_name: phoneForm.full_name.trim() },
    },
  })
  loading.value = false
  if (error) {
    message.error(error.message)
    return
  }
  message.success(t('auth.success_register'))
  navigateTo(localePath('/'))
}
</script>

<template>
  <div class="auth-wrap">
    <NCard :title="t('auth.register_title')" class="auth-card">
      <NButton
        block
        size="large"
        :loading="loading"
        @click="registerWithGoogle"
      >
        <template #icon>
          <NIcon><LogoGoogle /></NIcon>
        </template>
        {{ t('auth.login_with_google') }}
      </NButton>

      <NDivider>{{ t('auth.or') }}</NDivider>

      <NTabs v-model:value="tab" type="segment" animated>
        <NTabPane name="email" :tab="t('auth.login_with_email')">
          <NForm @submit.prevent="registerWithEmail">
            <NFormItem :label="t('auth.full_name')">
              <NInput v-model:value="emailForm.full_name" size="large" />
            </NFormItem>
            <NFormItem :label="t('auth.email')">
              <NInput
                v-model:value="emailForm.email"
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
              @click="registerWithEmail"
            >
              {{ t('auth.submit_register') }}
            </NButton>
          </NForm>
        </NTabPane>

        <NTabPane name="phone" :tab="t('auth.login_with_phone')">
          <NForm @submit.prevent="registerWithPhone">
            <NFormItem :label="t('auth.full_name')">
              <NInput v-model:value="phoneForm.full_name" size="large" />
            </NFormItem>
            <NFormItem :label="t('auth.phone')">
              <NInput
                v-model:value="phoneForm.phone"
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
              @click="registerWithPhone"
            >
              {{ t('auth.submit_register') }}
            </NButton>
          </NForm>
        </NTabPane>
      </NTabs>

      <p class="muted center">
        {{ t('auth.have_account') }}
        <NuxtLink :to="localePath('/login')" class="link">
          {{ t('auth.submit_login') }}
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
