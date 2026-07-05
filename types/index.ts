export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Court = {
  id: string
  name: string
  description: string | null
  address: string
  lat: number
  lng: number
  image_url: string | null
  is_approved: boolean
  is_outdoor: boolean
  surface: string
  hoops_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  followers_count?: number
  is_following?: boolean
  active_gatherings?: number
  distance?: number
}

export type CourtFollower = {
  id: string
  court_id: string
  user_id: string
  created_at: string
}

export type GameType = '3x3' | '5x5' | 'slobodan'
export type GameLevel = 'rekreativno' | 'srednji' | 'jak'

export type Gathering = {
  id: string
  court_id: string
  created_by: string
  title: string
  description: string | null
  gathering_time: string
  max_players: number | null
  game_type: GameType | null
  level: GameLevel | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  creator?: Profile
  court?: Court
  attendees_count?: number
  is_attending?: boolean
  attendees?: GatheringAttendee[]
  distance?: number
}

export type GatheringAttendee = {
  id: string
  gathering_id: string
  user_id: string
  status: 'dolazim' | 'ne_dolazim' | 'mozda' | 'no_show'
  created_at: string
  // joined
  profile?: Profile
}

export type GatheringComment = {
  id: string
  gathering_id: string
  user_id: string
  content: string
  created_at: string
  // joined
  profile?: Profile
}

export type CourtChatMessage = {
  id: string
  court_id: string
  user_id: string
  content: string
  created_at: string
  // joined
  profile?: Profile
}

export type Notification = {
  id: string
  user_id: string
  type: 'new_gathering' | 'new_comment' | 'new_attendee' | 'no_show' | 'court_approved'
  title: string
  body: string | null
  is_read: boolean
  related_court_id: string | null
  related_gathering_id: string | null
  created_at: string
}

export type CourtSuggestion = {
  id: string
  submitted_by: string
  name: string
  address: string
  lat: number
  lng: number
  description: string | null
  is_outdoor: boolean
  surface: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  // joined
  profile?: Profile
}

export type UserReputation = {
  id: string
  user_id: string
  arrivals_count: number
  no_show_count: number
  gatherings_created: number
  reputation_score: number
  updated_at: string
}
