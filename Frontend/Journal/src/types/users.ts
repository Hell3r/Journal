export type UserRecord = {
  id: number
  name?: string | null
  username: string
  email: string
  phone: string
  role: string
  is_active: boolean
  contractor_id?: number | null
  is_2fa_enabled: boolean
  date_joined: string
}
