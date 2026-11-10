# Milestone 5 · Private visits

The sample preview opens without credentials. Private mode uses Supabase Auth, Postgres, Storage, and Realtime. Each visitor signs in with an email code. The access function verifies the Auth token and checks the visitor’s seat before it reads the museum catalog or signs any media.

## Set up a private project

1. Create a dedicated Supabase project. Enable email sign-in, disable public signup, and configure the sign-in email template to contain `{{ .Token }}`. Provision the two visitor accounts in Authentication and configure delivery to their addresses. Use the intended frontend origin when configuring the project. [Email OTP setup](https://supabase.com/docs/guides/auth/auth-email-passwordless)
2. Apply `supabase/migrations/202611050001_private_museum.sql` with the linked Supabase CLI or the project SQL Editor. It creates the private storage bucket and two numbered membership seats per museum. Add the real Auth user UUIDs as the project owner.

   ```sql
   insert into public.ofm_visitors (museum, user_id, seat)
   values
     ('our-forever-museum', '<first Auth user UUID>', 1),
     ('our-forever-museum', '<second Auth user UUID>', 2);
   ```

   An optional `expires_at` limits a seat to a specific date and time. To revoke a seat, delete its membership row. A new catalog request and a new Realtime join then fail. Issued media links and existing Realtime authorization can outlive revocation until their respective expiry or reauthorization. [Realtime authorization and caching](https://supabase.com/docs/guides/realtime/authorization)
3. In the private `museum-private` bucket, upload `our-forever-museum/museum.json` plus the referenced display files. Keep the catalog and private files outside this repository and `public/`. The manifest has this shape.

   ```json
   {
     "museum": { "id": "our-forever-museum", "title": "Our Forever Museum", "dedication": "Your dedication", "memories": [] },
     "cinematics": { "film": {}, "music": "/media/music.mp3", "letter": {} }
   }
   ```

   Start with the structure in `src/content/museum.config.json`, `src/content/memories.json`, and `src/content/cinematics.json`. Set `museum.id` to the configured museum ID. Put the memories array inside `museum`, and use the fields from `cinematics.json` for the `cinematics` object. Include at least one memory. Keep the primary movie in `film` and add more under the optional `additionalFilms` array with the same fields. Include each movie’s poster and captions in the private bucket. For a manifest reference like `/images/memories/photo-01.jpg`, upload the object as `our-forever-museum/images/memories/photo-01.jpg`. Do the same for the film, poster, captions, and music under the museum’s `media/` folder. Use lowercase names with letters, numbers, hyphens, or underscores, and short cache lifetimes for the display files. [Private buckets and signed links](https://supabase.com/docs/guides/storage/buckets/fundamentals)
4. Set the Edge Function secrets `MUSEUM_ORIGIN` to the exact frontend origin and `MUSEUM_PUBLISHABLE_KEY` to the Supabase publishable key. Deploy `museum-access` with the included function configuration. Its gateway JWT check is disabled because the handler validates each bearer against Supabase Auth. The hosted runtime supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; keep the service role key server-side. In Realtime settings, disable public channel access. [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets) · [Realtime settings](https://supabase.com/docs/guides/realtime/settings)
5. Copy the private settings in `.env.example` into `.env.local`, then restart Vite. Use only the publishable key in the frontend configuration.

## Walk together

Open Settings and choose **Join shared visit**. Share the link shown there with the other invited visitor. A link requests the shared visit when opened. Each visitor still signs in and enters the 3D museum. The other visitor sees the character you select at the entrance or in Settings. Choose **Leave shared visit** to continue solo. Switching to the accessible gallery disconnects presence until you return to 3D.

Presence tracks who is online. Broadcast sends a bounded position and heading up to eight times per second while moving, with slower idle updates. The other browser validates and smooths the motion locally. Position packets stay off the database. The two seats are two accounts, so each visitor should use a single tab during a shared visit.

The access function issues short-lived links for the catalog’s media, capped at 30 minutes. When the visit expires, reopen it to check access and get fresh links. This resets the walking position. Private viewed progress lasts for the current visit.

## Verification and launch checks

Run the frontend checks with `npm run lint`, `npm test`, and `npm run build`. With Deno installed, run the access-function fixture with `deno test --allow-env supabase/functions/museum-access/handler_test.ts`.

Before uploading personal media, use a sample manifest to exercise the hosted stack. Verify email code delivery to both accounts, rejection of a third account, denial on direct catalog and storage requests, denial on private Realtime joins by an outsider, and playback after seeking in the hosted cinema. Verify that both invited browsers see motion, recover after a disconnect, and clean up presence on exit.

Local verification used isolated fixtures. The database migration passed checks for anonymous and outsider denial, two seats, expired membership, the grant rate limit, and denial of direct private-bucket reads even by members. The Edge Function test verified that rejected requests never reach storage and that valid requests sign only the catalog’s files. Two separate Chrome profiles exercised email-code entry, guest motion, reconnection, leaving, solo movement, and signed image and video loading against a local service fixture. These checks did not exercise email delivery, Supabase’s hosted services, or a production deployment.

The production dependency audit reported zero advisories after updating Zod and Vite. The full audit still reports findings in development tooling, including Vitest and its worker pool. The Vite build also retains the existing large 3D bundle warning.
