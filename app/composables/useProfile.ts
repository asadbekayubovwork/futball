import type { Database } from '~/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const profile = useState<Profile | null>('profile', () => null)
  const loading = ref(false)

  async function load() {
    if (!user.value) {
      profile.value = null
      return
    }
    loading.value = true
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .maybeSingle()
    profile.value = data ?? null
    loading.value = false
  }

  watch(
    user,
    (u) => {
      if (u) load()
      else profile.value = null
    },
    { immediate: true }
  )

  const isAdmin = computed(() => profile.value?.role === 'admin')

  return { profile, loading, load, isAdmin }
}
