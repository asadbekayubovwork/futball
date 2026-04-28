export interface DraftPlayer {
  id: string
  full_name: string
  skill_rating: number
  position?: string | null
}

export interface DraftTeam {
  index: number
  name: string
  color: string
  players: DraftPlayer[]
  totalSkill: number
}

const TEAM_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b']
const TEAM_NAMES = ['Yashil', 'Koʻk', 'Qizil', 'Sariq']

/**
 * Snake draft: o'yinchilarni mahorat bo'yicha kamayuvchi tartibga sortlab,
 * jamoalarga ilon usulida tarqatadi (1->2->3->3->2->1->1->2->...).
 * Bu eng balansli usul: jami mahorat farqi minimumlashtiriladi.
 *
 * Tasodifiy aralashtirish (mahorati bir xil o'yinchilar orasida) — har gal turli natija
 * berib, oldingi o'yindagi sherikliklar takrorlanmasligi uchun.
 */
export function snakeDraft(
  players: DraftPlayer[],
  teamCount: number
): DraftTeam[] {
  if (teamCount < 2) throw new Error('teamCount must be >= 2')
  if (players.length === 0) return []

  const sorted = [...players].sort((a, b) => {
    const skillDiff = b.skill_rating - a.skill_rating
    if (skillDiff !== 0) return skillDiff
    return Math.random() - 0.5
  })

  const teams: DraftTeam[] = Array.from({ length: teamCount }, (_, i) => ({
    index: i,
    name: TEAM_NAMES[i] ?? `Jamoa ${i + 1}`,
    color: TEAM_COLORS[i] ?? '#6b7280',
    players: [],
    totalSkill: 0,
  }))

  sorted.forEach((player, i) => {
    const round = Math.floor(i / teamCount)
    const positionInRound = i % teamCount
    const teamIdx = round % 2 === 0 ? positionInRound : teamCount - 1 - positionInRound
    teams[teamIdx].players.push(player)
    teams[teamIdx].totalSkill += player.skill_rating
  })

  return teams
}

export function recommendedTeamCount(playerCount: number): number {
  if (playerCount >= 24) return 4
  if (playerCount >= 18) return 3
  return 2
}
