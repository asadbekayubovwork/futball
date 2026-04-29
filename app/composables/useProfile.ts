import type { Database } from '~/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = useState<Profile | null>('profile', () => null)
  const loading = useState<boolean>('profile-loading', () => false)
  const loaded = useState<boolean>('profile-loaded', () => false)

  async function load(force = false) {
    if (loading.value) return
    if (loaded.value && !force && profile.value) return

    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id
      if (!userId) {
        profile.value = null
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      profile.value = data ?? null
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      load()
    })

    watch(
      () => user.value?.id,
      (id, prevId) => {
        if (id !== prevId) load(true)
        if (!id) profile.value = null
      }
    )
  }

  const isAdmin = computed(() => profile.value?.role === 'admin')

  return { profile, loading, loaded, load, isAdmin }
}
