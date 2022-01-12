export const dataUrlToBlob = async (dataUrl: string) =>
  await (await fetch(dataUrl)).blob()

export const isLocalUrl = (url: string | undefined) =>
  ['data:', 'blob:'].some((prefix) => url?.startsWith(prefix))

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}
