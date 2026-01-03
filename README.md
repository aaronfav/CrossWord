# crossword

Crossword is a Base + Farcaster Mini App that also runs as a normal open-web game. Build sub-words from a root word before the timer runs out.

## Prerequisites

- Node.js 20 LTS or 22 LTS (>=20 <23)
- Optional: Coinbase Developer Platform API key for OnchainKit features

## Install & run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in any browser. The game runs without wallets or mini app containers.

## No-download mode (use an existing Node 20/22)

If you already have Node 20 or 22 installed somewhere on this machine (even if your default `node` is 25), run:

```bash
npm run install:anynode
npm run dev:anynode
```

These scripts scan for other `node` binaries and use a compatible one if found.

## Docker mode (only if Docker is already installed)

```bash
npm run install:docker
npm run dev:docker
```

## Last resort (Node 25 only, may break at runtime)

If no compatible Node is available and Docker is not installed, you can bypass the preinstall check:

```bash
npm install --ignore-scripts
npm run dev
```

This is not supported and may fail at runtime.

## Environment variables

Create a `.env` file (or update the existing one):

```bash
NEXT_PUBLIC_PROJECT_NAME="crossword"
NEXT_PUBLIC_ONCHAINKIT_API_KEY=""
NEXT_PUBLIC_ACTIONS_CONTRACT_ADDRESS="0x..."
BASE_MAINNET_RPC_URL=""
DEPLOYER_PRIVATE_KEY=""
```

`NEXT_PUBLIC_ONCHAINKIT_API_KEY` is only needed if you plan to use OnchainKit paymaster features later.
`BASE_MAINNET_RPC_URL` and `DEPLOYER_PRIVATE_KEY` are used only for deployment.

## Mini App manifest

The Farcaster/Base mini app manifest lives at `public/.well-known/farcaster.json` and is served at:

```
https://<domain>/.well-known/farcaster.json
```

Replace the `accountAssociation.header`, `payload`, and `signature` placeholders with values from the Base Build tool and Farcaster tooling.

## Mini App readiness

When running inside Farcaster/Base, the app dynamically imports `@farcaster/miniapp-sdk` and calls `sdk.actions.ready()` once after hydration. Open-web users never load the SDK.

To verify locally:

1. Start the app with `npm run dev`.
2. Ensure the app renders in a normal browser with no SDK installed.
3. Ensure the splash screen dismisses inside the mini app container.

## Deployment

Deploy to any Next.js-compatible host (Vercel, Netlify, Fly, etc.). Ensure:

- The app is accessible at `/`
- The manifest is accessible at `/.well-known/farcaster.json`
- Static assets referenced in the manifest exist in `/public`

### Deploy the onchain actions contract (Base mainnet)

1. Set these env vars (use a wallet with ETH on Base mainnet):
   - `BASE_MAINNET_RPC_URL`
   - `DEPLOYER_PRIVATE_KEY`
2. Deploy:

```bash
npm run deploy:actions
```

3. Copy the deployed address into:
   - `NEXT_PUBLIC_ACTIONS_CONTRACT_ADDRESS`

## Testing

```bash
npm run test
```

## File map

- `app/components/Game.tsx`: game UI and logic
- `app/api/new-game`: new game endpoint
- `app/api/validate`: server-side word validation
- `app/api/reveal`: server-side sub-word reveal
- `public/.well-known/farcaster.json`: mini app manifest

## Wallet behavior

- Open web: the wallet button connects to the injected wallet (MetaMask or other browser wallets).
- Farcaster/Base mini app: the wallet button uses the native mini app wallet via the injected provider from the SDK.

## Difficulty settings

- Easy: 30 seconds, 3 required words
- Medium: 25 seconds, 4 required words
- Hard: 20 seconds, 4 required words
