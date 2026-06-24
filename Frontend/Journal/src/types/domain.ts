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
    user_id?: number | null
    name?: string | null
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
    name_of_contractor?: string | null
  }>
  systems: Array<{
    id: number
    address_id: number
    system_id: number
    system?: {
      id: number
      name: string
    } | null
  }>
  works: Array<{
    id: number
    address_id: number
    system_id?: number | null
    type_of_work_id: number
    technician_id: number
    description?: string | null
    created_at?: string
    system_name?: string | null
    address?: {
      id: number
      address_name: string
      systems?: Array<{
        id: number
        address_id: number
        system_id: number
        system?: {
          id: number
          name: string
        } | null
      }>
    }
    system?: {
      id: number
      name: string
    } | null
    type_of_work?: {
      id: number
      name: string
    } | null
    technician?: {
      id: number
      name?: string | null
      email: string
      username?: string | null
    } | null
  }>
  technicians?: Array<{
    id: number
    contractor_id: number
    address_id: number | null
    technician_id: number
    user?: {
      id: number
      name?: string | null
      username: string
      email: string
    } | null
  }>
}

export type ContractorRecord = {
  id: number
  name_of_contractor: string
  is_active: boolean
  engineer_id: number | null
  engineer?: {
    id: number
    name?: string | null
    email: string
    full_name?: string | null
  } | null
  addresses: Array<{
    id: number
    address_name: string
  }>
  technician_contractor: Array<{
    id: number
    contractor_id: number
    address_id: number | null
    technician_id: number
  }>
  technicians: Array<{
    id: number
    name?: string | null
    username: string
    email: string
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
    name?: string | null
    email: string
  }
}

export type SystemRecord = {
  id: number
  name: string
  addresses: Array<{
    id: number
    address_id: number
    system_id: number
    system: {
      id: number
      name: string
    }
  }>
}

export type TypeOfWorkRecord = {
  id: number
  name: string
}

export type WorkRecord = {
  id: number
  address_id: number
  system_id?: number | null
  type_of_work_id: number
  technician_id: number
  description: string | null
  created_at: string
  system_name?: string | null
  system?: {
    id: number
    name: string
  } | null
  address: {
    id: number
    address_name: string
    systems: Array<{
      id: number
      address_id: number
      system_id: number
      system?: {
        id: number
        name: string
      } | null
    }>
  }
  type_of_work: {
    id: number
    name: string
  }
  technician: {
    id: number
    name?: string | null
    username: string
    email: string
  }
}

export type TechnicianAssignmentRecord = {
  id: number
  contractor_id: number
  address_id: number | null
  technician_id: number
  contractor: {
    id: number
    name_of_contractor: string
  }
  address?: {
    id: number
    address_name: string
  } | null
  user: {
    id: number
    name?: string | null
    username: string
    email: string
  }
}
