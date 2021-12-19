# Turborepo Remote Cache API with Cloudflare KV

This is just a quick proof of concept for using Cloudflare Workers + KV as a remote cache alternative for Turborepo. So... you can use a globally distributed cache for your globally distributed cache? _(insert yo dawg memes here)_

```shell
pnpm install
pnpm dev
```

### Configure your Turborepo

In your turborepo, you simply need to add a config file in the same format that is done when using `npx turbo login; npx turbo link`. So, in the turborepo, set your `config.json` to look like this:

```js file=".turbo/config.json"
{
  "teamId": "someuniqueteamid",
  "apiUrl": "http://127.0.0.1:8787"
}
```

##### Confirming that this works

The following is copy and pasted from [the docs](https://turborepo.org/docs/features/remote-caching#for-local-development):

> Once enabled, make some changes to a package or application you are currently caching and run tasks against it with turbo run. Your cache artifacts will now be stored locally and in your Remote Cache.

> To verify, delete your local Turborepo cache with:

```shell
  rm -rf ./node_modules/.cache/turbo
```

> Then run the same build again. If things are working properly, turbo should not execute tasks locally, but rather download both the logs and artifacts from your Remote Cache and replay them back to you.

### Is this a good idea?

Honestly... haven't really thought too much about it! KV has a max size for a `value` of 25mb. I'd recommend reviewing the [KV Limits](https://developers.cloudflare.com/workers/platform/limits#kv) for any other gotchas.

### What could this look like in the future?

- It could be wrapped to support a service similar to Vercel's where teams/tokens have an admin panel for management
- KV entries could expire after a reasonable period of time
- Once R2 is public, you could put things in KV if it's size appropriate, then fall back over to R2 for larger storage needs (or some other S3 API like Backblaze B2, S3, etc etc).
