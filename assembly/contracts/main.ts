import { Args, stringToBytes } from '@massalabs/as-types';
import { Storage, isDeployingContract } from '@massalabs/massa-as-sdk';

import * as NFT from '@massalabs/sc-standards/assembly/contracts/NFT/NFT-example';
import { onlyOwner } from '@massalabs/sc-standards/assembly/contracts/utils/ownership';

const uriKey = stringToBytes('BASE_URI');

export function constructor(_: StaticArray<u8>): void {
  assert(isDeployingContract());
  const name = "Obvious";
  const symbol = "OBVIOUS";
  Storage.set(uriKey, stringToBytes("https://obvious-nft.s3.eu-west-3.amazonaws.com/Obvious-m"));
  NFT.constructor(new Args().add(name).add(symbol).serialize());
}

export function setURI(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
  const uri = args.nextString().expect('uri argument is missing or invalid');
  Storage.set(uriKey, stringToBytes(uri));
}

export function baseURI(): StaticArray<u8> {
  return Storage.get(uriKey);
}

export * from '@massalabs/sc-standards/assembly/contracts/NFT/NFT-example';
