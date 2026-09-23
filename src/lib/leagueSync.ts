import { seedMatches, seedPlayers, seedSeasons } from '../data/seed'
import { useLeagueStore, type ArenaSuggestionRecord } from '../store/useLeagueStore'
import { supabase, supabaseEnabled } from './supabase'
import type { Match, Player, Season } from '../types'

const TABLE = 'league_state'
const ROW_ID = 1
const PUSH_DEBOUNCE_MS = 400

export type SyncStatus = 'disabled' | 'connecting' | 'live' | 'error'

interface SyncedState {
  players: Player[]
  matches: Match[]
  seasons: Season[]
  arenaSuggestions: ArenaSuggestionRecord[]
}

let applyingRemote = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let started = false

function snapshot(): SyncedState {
  const s = useLeagueStore.getState()
  return { players: s.players, matches: s.matches, seasons: s.seasons, arenaSuggestions: s.arenaSuggestions }
}

async function pushState() {
  if (!supabase) return
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, data: snapshot(), updated_at: new Date().toISOString() })
  if (error) console.error('League sync: push failed', error)
}

function schedulePush() {
  if (applyingRemote) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(pushState, PUSH_DEBOUNCE_MS)
}

function applyRemote(data: SyncedState) {
  applyingRemote = true
  useLeagueStore.setState(data)
  applyingRemote = false
}

/**
 * Turns the local zustand store into a thin client of a shared Supabase row:
 * fetch-and-hydrate on boot, push local changes (debounced), and apply
 * remote changes from other visitors via Realtime. No-ops entirely when
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't configured, so the app
 * keeps working exactly as before (per-browser localStorage only).
 */
export async function startLeagueSync(onStatus?: (status: SyncStatus) => void): Promise<void> {
  if (started) return
  started = true

  if (!supabaseEnabled || !supabase) {
    onStatus?.('disabled')
    return
  }

  onStatus?.('connecting')

  const { data, error } = await supabase.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle()

  if (error) {
    console.error('League sync: initial load failed', error)
    onStatus?.('error')
    return
  }

  if (data?.data) {
    applyRemote(data.data as SyncedState)
  } else {
    // Table exists but is empty: seed it from the bundled starting data so
    // every visitor's very first load shares the same baseline.
    const seed: SyncedState = { players: seedPlayers, matches: seedMatches, seasons: seedSeasons, arenaSuggestions: [] }
    applyRemote(seed)
    await pushState()
  }

  useLeagueStore.subscribe(() => schedulePush())

  supabase
    .channel('league_state_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = (payload.new as { data?: SyncedState } | undefined)?.data
        if (next) applyRemote(next)
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus?.('live')
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onStatus?.('error')
    })
}
