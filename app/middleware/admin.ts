export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const localePath = useLocalePath()

  if (!user.value) {
    return navigateTo(localePath('/login'))
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.value.id)
    .single()

  if (data?.role !== 'admin') {
    return navigateTo(localePath('/'))
  }
})
