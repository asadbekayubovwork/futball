import type { Database } from '~/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = useState<Profile | null>('profile', () => null)
  const loading = ref(false)

  async function load() {
    const userId = user.value?.id
    if (!userId) {
      profile.value = null
      return
    }
    loading.value = true
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    profile.value = data ?? null
    loading.value = false
  }

  watch(
    () => user.value?.id,
    (id) => {
      if (id) load()
      else profile.value = null
    },
    { immediate: true }
  )

  const isAdmin = computed(() => profile.value?.role === 'admin')

  return { profile, loading, load, isAdmin }
}
