import fs from "fs";
import { deployContract } from "starknet";

function getCompiledContractString(path) {
  return fs.readFileSync(path).toString("ascii");
}

const nymCompiledContractString = getCompiledContractString(
  "./contracts/build/nym_compiled.json"
);

const accountCompiledContractString = getCompiledContractString(
  "./contracts/build/OpenZeppelin/Account_compiled.json"
);

async function deployAccount() {}

async function deploy() {
  const response = await deployContract(
    nymCompiledContractString
    /*
    Contract.compileCalldata({
      signer: randomAddress(),
      guardian: "0",
      L1_address: "0",
    })*/
  );
  console.log("response", response);
}

/*
const inputContract = compiledArgentAccount as unknown as CompiledContract;

const response = await deployContract(
  inputContract,
  Contract.compileCalldata({
    signer: randomAddress(),
    guardian: '0',
    L1_address: '0',
  })
);
*/

deploy().then(() => {
  console.log("Done");
  process.exit(0);
});
