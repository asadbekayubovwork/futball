export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const localePath = useLocalePath()

  const userId = user.value?.id
  if (!userId) {
    return navigateTo(localePath('/login'))
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (data?.role !== 'admin') {
    return navigateTo(localePath('/'))
  }
})
