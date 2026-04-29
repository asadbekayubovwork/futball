export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient()
  const localePath = useLocalePath()

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

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
