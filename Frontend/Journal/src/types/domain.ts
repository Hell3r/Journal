export type CustomerRecord = {
  id: number
  name_of_org: string
  email: string
  is_active: boolean
  addresses: Array<{
    id: number
    address_name: string
  }>
  curators: Array<{
    id: number
    email: string
    is_active: boolean
  }>
}

export type AddressRecord = {
  id: number
  customer_id: number
  address_name: string
  contractors: Array<{
    id: number
    name?: string | null
  }>
  systems: Array<{
    id: number
    name?: string | null
  }>
  works: Array<{
    id: number
    description?: string | null
  }>
  technicians?: Array<{
    id: number
    full_name?: string | null
  }>
}

export type ContractorRecord = {
  id: number
  name_of_contractor: string
  is_active: boolean
  engineer_id: number | null
  engineer?: {
    id: number
    email: string
    full_name?: string | null
  } | null
  addresses: Array<{
    id: number
    address_name: string
  }>
}

export type CuratorRequestRecord = {
  id: number
  customer_id: number
  user_id: number
  is_active: boolean
  customer: {
    id: number
    name_of_org: string
    email: string
    is_active: boolean
  }
  user: {
    id: number
    email: string
  }
}
