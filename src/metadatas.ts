import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSON5 from 'json5'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

const hodlers: string[] = JSON5.parse(readFileSync(path.join(__dirname,'holders.json5')).toString());

const description = "Congratulations, Enigma Solver!\n\
This NFT celebrates your victory in solving the Enigmas from Counterfeit Reality. You've proven your skill and teamwork.\n\
Stay curious and game on!";

hodlers.map((holder, idx) => {
    const tokenId = idx + 1;
    const assetId = tokenId <= 4 ? `${tokenId}` : "default"
    const meta = {
        name: `Obvious #${tokenId}`,
        description,
        image: `https://obvious-nft.s3.eu-west-3.amazonaws.com/Obvious-p/${assetId}`,
        edition: tokenId,
        date: Date.now(),
        attributes: [
        ]
      }
    
    writeFileSync(path.join(__dirname, 'metadatas', `${tokenId}`), JSON.stringify(meta, null, 2))
})
