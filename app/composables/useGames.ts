import type { Database } from '~/types/database.types'

export type Game = Database['public']['Tables']['games']['Row']
export type GameStatus = Game['status']

export function useGames() {
  const supabase = useSupabaseClient<Database>()

  async function listUpcoming(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .in('status', ['upcoming', 'team_formed', 'in_progress'])
      .order('played_at', { ascending: true })
    return data ?? []
  }

  async function listCompleted(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'completed')
      .order('played_at', { ascending: false })
    return data ?? []
  }

  async function listAll(): Promise<Game[]> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('played_at', { ascending: false })
    return data ?? []
  }

  async function getById(id: string): Promise<Game | null> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return data
  }

  async function getNextUpcoming(): Promise<Game | null> {
    const { data } = await supabase
      .from('games')
      .select('*')
      .in('status', ['upcoming', 'team_formed'])
      .gte('played_at', new Date().toISOString())
      .order('played_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data
  }

  return { listUpcoming, listCompleted, listAll, getById, getNextUpcoming }
}
