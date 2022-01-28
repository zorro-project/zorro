import {UseToastOptions} from '@chakra-ui/react'
import {navigate} from '@redwoodjs/router'
import {NavigateOptions} from '@redwoodjs/router/dist/history'
import {omit} from 'lodash'
import {queueToast} from 'src/layouts/AppLayout/ToastManager'
import {cidToUrl} from './ipfs'

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

export const maybeCidToUrl: (value: string) => string = (value) => {
  if (isLocalUrl(value)) return value
  return cidToUrl(value)
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
