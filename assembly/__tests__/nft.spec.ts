import { Args, stringToBytes } from '@massalabs/as-types';
import { baseURI, constructor, setURI } from '../contracts/main';
import { setDeployContext } from '@massalabs/massa-as-sdk';

describe('NFT tests', () => {
  beforeAll(() => {
    setDeployContext();
    constructor([]);
  } );

  test('URI is set', () => {
    expect(baseURI()).toStrictEqual(stringToBytes("baseURI"));
  });

  test('owner can change uri', () => {
    const newURI = "newURI";
    setURI(new Args().add(newURI).serialize())
    expect(baseURI()).toStrictEqual(stringToBytes("newURI"));
  });
});
