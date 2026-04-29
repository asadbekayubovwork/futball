export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const localePath = useLocalePath()

  const { data } = await supabase.auth.getSession()

  if (!data.session?.user?.id) {
    return navigateTo({
      path: localePath('/login'),
      query: { redirect: to.fullPath },
    })
  }
})
