// Hacky polyfill, not sure why this is necessary since TextEncoder should be available by default in Node 14?
// https://github.com/ipfs/js-ipfs/issues/3620
// https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-definedin-jest
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
