import { Args, MAX_GAS_CALL, toMAS } from '@massalabs/massa-web3';
import { BLOCK_TIME, getClient, waitFinalOperation } from './utils';
import JSON5 from 'json5';
import { config } from 'dotenv';
import { scheduler } from 'timers/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
config();

const nftContract = 'AS1CGg8DfCYT7Vwxb4FzZDhzx8qgokSGUubMWQVXVdQTj5p2L9sJ';

const { baseAccount, client } = await getClient();

const hodlers: string[] = JSON5.parse(
  readFileSync(path.join(__dirname, 'holders.json5')).toString(),
);

const maxGas = 2_100_000n;
const maxOpPrBlock = Number(MAX_GAS_CALL / maxGas);
const fee = await client.publicApi().getMinimalFees();

let spent = 0n;
let errors: string[] = [];
await Promise.all(
  hodlers.map(async (holder, idx) => {
    // throttle minting operations
    await scheduler.wait((idx * 10 * BLOCK_TIME * 1000) / maxOpPrBlock);
    const tokenId = idx + 1;

    console.log(`Minting token ${tokenId} to ${holder}`);
    const coins = holder.length === 52 ? 17800000n : 18000000n;
    spent += fee + coins;
    const operationId = await client.smartContracts().callSmartContract(
      {
        fee,
        maxGas,
        coins,
        targetAddress: nftContract,
        targetFunction: 'mint',
        parameter: new Args()
          .addString(holder)
          .addU256(BigInt(tokenId))
          .serialize(),
      },
      baseAccount,
    );

    try {
      await waitFinalOperation(client, operationId);
    } catch (e) {
      errors.push(`Error minting token ${tokenId} to ${holder}: ${e.message}`);
      return;
    }
    console.log(`Mint of token ${tokenId} is final`);
  }),
);
console.log(`total mint price: ${toMAS(spent)} MAS`);

console.log(`Done`);
if (errors.length) {
  console.log(`Errors:`);
  errors.map((e) => console.log(e));
}
