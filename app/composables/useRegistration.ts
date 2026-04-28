import type { Database } from '~/types/database.types'

type Registration = Database['public']['Tables']['registrations']['Row']

export function useRegistration() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  async function getMyRegistration(gameId: string): Promise<Registration | null> {
    if (!user.value) return null
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', user.value.id)
      .maybeSingle()
    return data
  }

  async function listForGame(gameId: string) {
    const { data } = await supabase
      .from('registrations')
      .select('*, profile:profiles(*)')
      .eq('game_id', gameId)
      .eq('status', 'going')
      .order('registered_at', { ascending: true })
    return data ?? []
  }

  async function join(gameId: string) {
    if (!user.value) throw new Error('not authenticated')
    const { error } = await supabase.from('registrations').upsert(
      {
        game_id: gameId,
        player_id: user.value.id,
        status: 'going',
      },
      { onConflict: 'game_id,player_id' }
    )
    if (error) throw error
  }

  async function leave(gameId: string) {
    if (!user.value) throw new Error('not authenticated')
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('game_id', gameId)
      .eq('player_id', user.value.id)
    if (error) throw error
  }

  return { getMyRegistration, listForGame, join, leave }
}
