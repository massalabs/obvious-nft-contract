import {
  Client,
  IAccount,
  IBaseAccount,
  EOperationStatus,
  IEvent,
  ProviderType,
  PublicApiClient,
  WalletClient,
  Web3Account,
} from '@massalabs/massa-web3';
import { scheduler } from 'timers/promises';

export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env file`);
  }
  return value;
}

export const getClient = async (): Promise<{
  client: Client;
  account: IAccount;
  baseAccount: IBaseAccount;
  chainId: bigint;
}> => {
  const secretKey = getEnvVariable('WALLET_SECRET_KEY');
  const rpc = getEnvVariable('JSON_RPC_URL_PUBLIC');

  const account = await WalletClient.getAccountFromSecretKey(secretKey);

  const clientConfig = {
    retryStrategyOn: true,
    providers: [{ url: rpc, type: ProviderType.PUBLIC }],
    periodOffset: 9,
  };

  const publicApi = new PublicApiClient(clientConfig);
  const status = await publicApi.getNodeStatus();

  const web3account = new Web3Account(account, publicApi, status.chain_id);
  const client = new Client(clientConfig, web3account, publicApi);

  return {
    client,
    account,
    baseAccount: client.wallet().getBaseAccount()!,
    chainId: status.chain_id,
  };
};

export async function getOperationEvents(
  client: Client,
  opId: string,
): Promise<IEvent[]> {
  return client.smartContracts().getFilteredScOutputEvents({
    start: null,
    end: null,
    original_caller_address: null,
    original_operation_id: opId,
    emitter_address: null,
    is_final: null,
  });
}

export const WAIT_STATUS_TIMEOUT = 300000;
export const BLOCK_TIME = 16;

export const waitFinalOperation = async (
  client: Client,
  opId: string,
): Promise<IEvent[]> => {
  const start = Date.now();
  let counterMs = 0;
  while (counterMs < WAIT_STATUS_TIMEOUT) {
    const status = await client.smartContracts().getOperationStatus(opId);
    if (status === EOperationStatus.SPECULATIVE_SUCCESS) {
      return getOperationEvents(client, opId);
    }
    if (
      status === EOperationStatus.FINAL_ERROR ||
      status === EOperationStatus.SPECULATIVE_ERROR
    ) {
      const events = await getOperationEvents(client, opId);
      if (!events.length) {
        console.log(
          `Operation ${opId} failed with no events! Try to increase maxGas`,
        );
      }
      events.map((l) => console.log(`>>>> New event: ${l.data}`));
      throw new Error(`Operation ended with errors...`);
    }

    await scheduler.wait(BLOCK_TIME * 1000);
    counterMs = Date.now() - start;
  }
  const status = await client.smartContracts().getOperationStatus(opId);
  throw new Error(
    `Wait operation timeout... status=${EOperationStatus[status]}`,
  );
};
