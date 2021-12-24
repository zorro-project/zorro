const KEY = 'INTENDED_CONNECTION'

export type IntendedConnection = {
  type: 'snapshot'
  spaceId: string
  voterAddress: string
}

export function save(target: IntendedConnection) {
  console.log('Saving intended connection', target)
  return localStorage.setItem(KEY, JSON.stringify(target))
}

export function load() {
  const value = localStorage.getItem(KEY)
  return value === null ? null : JSON.parse(value)
}
