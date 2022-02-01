import {ApiProcessEnv} from './environment'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ApiProcessEnv {}
  }
}

export {}
