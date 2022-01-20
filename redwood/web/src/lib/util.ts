import {NavigateOptions} from '@redwoodjs/router/dist/history'
import {navigate} from '@redwoodjs/router'
import {UseToastOptions} from '@chakra-ui/react'
import {queueToast} from 'src/layouts/AppLayout/ToastManager'
import {omit} from 'lodash'

export const dataUrlToBlob = async (dataUrl: string) =>
  await (await fetch(dataUrl)).blob()

export const isLocalUrl = (url: string | undefined) =>
  ['data:', 'blob:'].some((prefix) => url?.startsWith(prefix))

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

export const appNav = (
  url: string,
  options?: NavigateOptions & {toast?: UseToastOptions}
) => {
  if (options?.toast) queueToast(options.toast)
  navigate(url, omit(options, 'toast'))
  return null
}
