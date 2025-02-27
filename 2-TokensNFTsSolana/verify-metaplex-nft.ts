import {
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import "dotenv/config";
import {
    keypairIdentity,
    publicKey as UMIPublicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
    getExplorerLink,
    getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
const collectionAddress = UMIPublicKey("Quua2NgX1uuXBEQZquKUKPSyePTMWmXvfWU55EGwG7F");

// Substitute in your NFT address from create-metaplex-nft.ts
const nftAddress = UMIPublicKey("pGNxUEw85XTTfVCQViVyQG3n6Mo7FFCAP8X6XNWabtU");

// Verify our collection as a Certified Collection
// See https://developers.metaplex.com/token-metadata/collections
const metadata = findMetadataPda(umi, { mint: nftAddress });
await verifyCollectionV1(umi, {
    metadata,
    collectionMint: collectionAddress,
    authority: umi.identity,

}).sendAndConfirm(umi);

let explorerLink = getExplorerLink("address", nftAddress, "devnet");
console.log(`verified collection:  ${explorerLink}`);
console.log("✅ Finished successfully!");