import crypto from 'crypto'
import {ec} from 'starknet'

console.log(ec.getKeyPair)

const numBytes = Math.floor(251 / 8) // 251 bits is what fits in a felt
const buffer = crypto.randomBytes(numBytes)

const privateKey = `0x${buffer.toString('hex')}`

const keyPair = ec.getKeyPair(privateKey)
const publicKey = ec.getStarkKey(keyPair)

console.log('private', privateKey)
console.log('public', publicKey)
