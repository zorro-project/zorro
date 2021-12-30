const KEY = 'INTENDED_CONNECTION'

export type IntendedConnection = {
  purposeIdentifier: string // e.g. 'citydao'
  externalAddress: string
}

export function save(target: IntendedConnection) {
  console.log('Saving intended connection', target)
  return localStorage.setItem(KEY, JSON.stringify(target))
}

export function load(): IntendedConnection | null {
  const value = localStorage.getItem(KEY)
  return value === null ? null : JSON.parse(value)
}
