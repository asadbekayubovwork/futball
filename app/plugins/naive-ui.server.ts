import { setup } from '@css-render/vue3-ssr'

export default defineNuxtPlugin((nuxtApp) => {
  const { collect } = setup(nuxtApp.vueApp)
  const event = nuxtApp.ssrContext?.event
  if (event) {
    event.context.__naiveUiCollect = collect
  }
})
