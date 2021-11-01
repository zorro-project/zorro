export const dataUrlToBlob = async (dataUrl: string) =>
  await (await fetch(dataUrl)).blob()

export type DataFieldType = string | Blob | undefined

export const dataFieldToUrl: (value: DataFieldType) => string | undefined = (
  value
) => {
  if (value == null) return undefined
  if (value instanceof Blob) {
    return URL.createObjectURL(value)
  }
  if (value?.includes('/')) {
    // For local development we're using some profiles hosted on Kleros IPFS
    return `https://ipfs.kleros.io/ipfs/${value}`
  }
  return `https://${value}.ipfs.infura-ipfs.io`
}

export const useDataFieldUrl = (value: DataFieldType) =>
  React.useMemo(() => dataFieldToUrl(value), [value])

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}
