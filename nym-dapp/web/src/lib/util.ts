export const dataUrlToBlob = async (dataUrl: string) =>
  await (await fetch(dataUrl)).blob()
