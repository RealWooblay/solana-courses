import {
    createNft,
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import "dotenv/config";
import {
    createGenericFile,
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey as UMIPublicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
    getExplorerLink,
    getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { promises as fs } from "fs";
import * as path from "path";
// create a new connection to Solana's devnet cluster
const connection = new Connection(clusterApiUrl("devnet"));

// load keypair from local file system
const user = getKeypairFromEnvironment("SECRET_KEY");
console.log("Loaded user:", user.publicKey.toBase58());

const umi = createUmi(connection);

// convert to umi compatible keypair
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// load our plugins and signer
umi
    .use(keypairIdentity(umiKeypair))
    .use(mplTokenMetadata())
    .use(irysUploader());


// Substitute in your collection NFT address from create-metaplex-nft-collection.ts
const collectionNftAddress = UMIPublicKey("Quua2NgX1uuXBEQZquKUKPSyePTMWmXvfWU55EGwG7F");


const NFTImagePath = path.resolve(__dirname, "./nft.png");

const buffer = await fs.readFile(NFTImagePath);
let file = createGenericFile(buffer, NFTImagePath, {
    contentType: "image/png",
});

// upload image and get image uri
const [image] = await umi.uploader.upload([file]);
console.log("image uri:", image);

// upload offchain json using irys and get metadata uri
const uri = await umi.uploader.uploadJson({
    name: "My NFT",
    symbol: "MN",
    description: "My NFT Description",
    image,
});
console.log("NFT offchain metadata URI:", uri);


// generate mint keypair
const mint = generateSigner(umi);

// create and mint NFT
await createNft(umi, {
    mint,
    name: "My NFT",
    symbol: "MN",
    uri,
    updateAuthority: umi.identity.publicKey,
    sellerFeeBasisPoints: percentAmount(0),
    collection: {
        key: collectionNftAddress,
        verified: false,
    },
}).sendAndConfirm(umi, { send: { commitment: "finalized" } });

let explorerLink = getExplorerLink("address", mint.publicKey, "devnet");
console.log(`Token Mint:  ${explorerLink}`);