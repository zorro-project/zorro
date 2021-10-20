export const dataUrlToBlob = async (dataUrl: string) =>
  await (await fetch(dataUrl)).blob()

export const dataFieldToUrl: (
  value: string | Blob | undefined
) => string | undefined = (value) =>
  value &&
  (value instanceof Blob
    ? URL.createObjectURL(value)
    : `https://${value}.ipfs.infura-ipfs.io`)

export const useDataFieldUrl = (value: string | Blob | undefined) =>
  React.useMemo(() => dataFieldToUrl(value), [value])
