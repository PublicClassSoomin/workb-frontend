export type IntegrationStatus = 'connected' | 'disconnected' | 'error'

export interface Integration {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  connectedAs?: string
  lastSynced?: string
  icon: string // emoji or icon name
}
