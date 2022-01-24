import fs from 'fs'
import {basename} from 'path'
import fetch from 'node-fetch'

// Partially based on https://github.com/kleros/pmw-contracts/blob/master/deploy/1_deploy_pmw.js

// returns metaEvidenceInterfaceURI
async function deploy(superAdjudicatorAddress) {
  console.log('Deploying primary document')
  const primaryDocumentURI = await deployAsset('./assets/primaryDocument.txt')
  console.log('Primary document URI:', primaryDocumentURI)

  console.log('Deploying evidence display interface')
  const evidenceDisplayInterfaceURI = await deployEvidenceInterface(
    superAdjudicatorAddress
  )
  console.log('Evidence display interface URI:', evidenceDisplayInterfaceURI)

  console.log('Deploying metaEvidence')
  const metaEvidenceURI = await deployMetaEvidence(
    primaryDocumentURI,
    evidenceDisplayInterfaceURI
  )
  console.log(
    `MetaEvidence URI: ${metaEvidenceURI} (https://ipfs.kleros.io${metaEvidenceURI})`
  )

  return metaEvidenceURI
}

async function deployEvidenceInterface(
  superAdjudicatorAddress,
  zorroProfileUrlPrefix
) {
  const evidenceInterface = `
    <script>
      SUPER_ADJUDICATOR_ADDRESS = ${JSON.stringify(superAdjudicatorAddress)}
      ZORRO_PROFILE_URL_PREFIX = ${JSON.stringify(zorroProfileUrlPrefix)}
    </script>
    ${fs.readFileSync('evidenceInterface.html')}
  `

  const evidenceInterfaceURI = await publishToIpfs(
    'evidenceInterface.html',
    evidenceInterface
  )

  return evidenceInterfaceURI
}

async function deployMetaEvidence(
  primaryDocumentURI,
  evidenceDisplayInterfaceURI
) {
  // Latest documentation of metaEvidence seems to be https://github.com/ethereum/EIPs/issues/1497
  const metaEvidence = {
    _v: '1.0.0', // ERC-1497 version number
    category: '',
    title: 'Zorro Adjudication Review',
    description:
      'A request to review a decision by the Zorro protocol adjudicator',
    question:
      'Did the Zorro adjudicator make a decision that was reasonable, *given the information that they had at the time*?',
    rulingOptions: {
      type: 'single-select',
      titles: ['Yes', 'No'],
      descriptions: [
        'The decision was reasonable',
        'The decision was unreasonable',
      ],
    },
    evidenceDisplayInterfaceURI,

    // injects the `arbitrableInterfaceURI` param: https://ipfs.kleros.io/ipfs/QmZZHwVaXWtvChdFPG4UeXStKaC9aHamwQkNTEAfRmT2Fj
    dynamicScriptURI: '/ipfs/QmZZHwVaXWtvChdFPG4UeXStKaC9aHamwQkNTEAfRmT2Fj',
    fileURI: primaryDocumentURI,
  }

  const metaEvidenceURI = await publishToIpfs(
    'metaEvidence.json',
    JSON.stringify(metaEvidence)
  )

  return metaEvidenceURI
}

async function deployAsset(path) {
  if (!fs.existsSync(path)) throw new Error('Missing primary document')
  const fileName = basename(path)
  const content = fs.readFileSync(path)
  const uri = await publishToIpfs(fileName, content)
  return uri
}

// From https://github.com/kleros/pmw-contracts/blob/master/deploy/1_deploy_pmw.js
async function publishToIpfs(fileName, str) {
  const buffer = await Buffer.from(new TextEncoder().encode(str))

  return new Promise((resolve, reject) => {
    fetch('https://ipfs.kleros.io/add', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        buffer,
      }),
      headers: {
        'content-type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((success) =>
        resolve(`/ipfs/${success.data[1].hash}${success.data[0].path}`)
      )
      .catch((err) => reject(err))
  })
}

;(async () => {
  console.log('Starting')
  await deploy()
  console.log('Done')
})()
