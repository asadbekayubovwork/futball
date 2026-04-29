export function useAuthUser() {
  const supabase = useSupabaseClient()

  async function getId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  }

  return { getId }
}
