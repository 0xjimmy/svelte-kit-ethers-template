# Svelte Kit Ethers Boilerplate

![Svelte](https://avatars.githubusercontent.com/u/23617963?s=200&v=4 'Svelte Kit')
![Ethers](https://avatars.githubusercontent.com/u/18492273?s=200&v=4 'Ethers')
![Tailwind](https://avatars.githubusercontent.com/u/67109815?s=200&v=4 'Tailwind')
![Typescript|200](https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci8zZTJiMzQyNjE2ODIyZjhlYWJjOWRkMzkzODQwZGI0YT9zaXplPTEwMCZkZWZhdWx0PXJldHJvIn0.iAUcZWWy4VL_-3PJlivtUwiUiSod4tyaj8h9sbcfAac 'Typescript')


## Basic Setup

Install dependencies
```bash
yarn
```
Start development server

```bash
yarn dev
```

**Building**
Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
yarn build
```

> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.

## Config

For you can configure 1 network, multi-network support will be developed soon

Edit the config file `./src/lib/config.ts` to set network information.
If no RPC endpoint is provided a public endpoint will be used via `ethers.providers.getDefaultProvider()`, this may impact performance so it is recommended to provide your own endpoint to avoid ratelimits.
