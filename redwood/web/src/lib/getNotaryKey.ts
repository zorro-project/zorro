const LS_KEY = 'ZORRO_NOTARY_KEY'

const getNotaryKey = (): string | null => {
  let key = localStorage.getItem(LS_KEY)

  if (!key) {
    const providedKey = window.prompt(
      'Provide the authorized private key for the Zorro notary contract (eg "0x1234..."'
    )
    if (!providedKey) {
      alert('Error: no notary key provided')
    } else {
      key = providedKey
      localStorage.setItem(LS_KEY, key)
    }
  }

  return key
}

export default getNotaryKey
