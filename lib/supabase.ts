import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface PersonalInfo {
  id: number
  name: string
  designation: string
  location: string
  experience_years: number
  email: string
  github: string
  linkedin: string
  bio: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: number
  category: string
  skill: string
  created_at: string
  updated_at: string
}

export interface Blog {
  id: number
  title: string
  published_date: string
  category: string
  read_time: number
  views: number
  url: string
  status: string
  created_at: string
  updated_at: string
}

export interface Experience {
  id: number
  company: string
  position: string
  start_date: string
  end_date: string | null
  description: string
  created_at: string
  updated_at: string
}
