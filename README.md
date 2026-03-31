# Wishster

Application web **Next.js (App Router)** pour un jeu musical privé façon blind test : chaque **QR code** ouvre une page `/play/[slug]` qui lance la lecture **dans le navigateur** via le **Spotify Web Playback SDK**, sans afficher titre, artiste ni pochette avant la **révélation**.

## Stack

- Next.js 16, React 19, TypeScript strict
- Tailwind CSS 4, shadcn/ui (Base UI)
- Supabase (PostgreSQL) — accès admin via **clé service** côté serveur
- OAuth Spotify + cookies httpOnly pour les tokens
- Vercel (recommandé)

## Arborescence (principale)

```
src/
  app/
    page.tsx                    # Accueil
    play/[slug]/                # Page publique de jeu
    admin/
      login/                    # Connexion admin (mot de passe)
      (shell)/                  # Routes protégées (cookie admin)
        cards/
        print/
    api/
      spotify/                  # OAuth, session, recherche, lecture, token SDK
      admin/                    # CRUD cartes, login admin
      play/[slug]/reveal/       # Métadonnées après révélation uniquement
  components/
    admin/                      # Formulaires & listes
    play/                       # UI jeu (sans métadonnées avant reveal)
    qr/                         # Affichage QR (client)
  hooks/
    use-spotify-web-player.ts
  lib/
    supabase/service.ts         # Client service role (serveur uniquement)
    spotify/                    # Cookies, tokens, API, parse URI
    admin-session.ts            # Cookie admin signé
    slug.ts, qr.ts, card-url.ts
  types/
supabase/migrations/            # Schéma SQL
```

## Variables d’environnement

Copie `.env.example` vers `.env.local` et renseigne :

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_APP_URL` | URL publique sans slash final (QR + liens), ex. `https://ton-domaine.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (peu utilisée côté app ; la lecture/écriture sensible passe par la service role) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement** — liste/création/MAJ cartes, page jeu serveur |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | App Spotify |
| `SPOTIFY_REDIRECT_URI` | Identique au redirect Spotify. **Spotify n’autorise plus `localhost`** : utilise `http://127.0.0.1:PORT/...` (ou `http://[::1]:PORT/...`) en local — [doc redirect URI](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri) |
| `SPOTIFY_SCOPES` | Défaut : `streaming user-read-playback-state user-modify-playback-state user-read-email` |
| `ADMIN_PASSWORD` | Mot de passe pour l’accès `/admin/*` (hors login) |
| `ADMIN_SESSION_SECRET` | Secret pour signer le cookie admin (ex. `openssl rand -hex 32`) |

## Setup Supabase

1. Crée un projet Supabase.
2. Dans l’éditeur SQL, exécute le fichier `supabase/migrations/001_cards.sql` (table `cards`, index, RLS lecture anonyme des cartes **actives**).
3. Récupère l’URL, la clé **anon** et la clé **service_role** (Settings → API).

## Setup Spotify

1. [Dashboard Spotify](https://developer.spotify.com/dashboard) : crée une app.
2. **Redirect URI** : identique à `SPOTIFY_REDIRECT_URI`. Depuis avril 2025, Spotify **interdit** `http://localhost:...` ; en local, enregistre par ex. `http://127.0.0.1:3000/api/spotify/callback` et mets la même valeur dans `.env.local`. Ouvre l’app avec **http://127.0.0.1:3000** (pas `localhost`) pour que les cookies OAuth restent sur le même « site ».
3. Le **Web Playback SDK** impose en pratique un compte **Spotify Premium** pour la lecture dans le navigateur.

**Alternative** : tunnel HTTPS (ngrok, Cloudflare Tunnel, etc.) avec une URL publique en redirect + `NEXT_PUBLIC_APP_URL` alignée — utile si tu préfères ne pas utiliser 127.0.0.1.

## Lancer en local

```bash
npm install
cp .env.example .env.local
# Édite .env.local avec toutes les clés
npm run dev
```

Ouvre l’URL de ton app (en local avec Spotify : de préférence [http://127.0.0.1:3000](http://127.0.0.1:3000) pour coller au redirect URI).

1. Connecte-toi à **Spotify** depuis l’accueil.
2. Va sur `/admin/login`, entre `ADMIN_PASSWORD`.
3. Crée une carte (`/admin/cards/new`), imprime les QR (`/admin/print`).
4. Scanne un QR : la page `/play/[slug]` ne montre les métadonnées qu’après **Révéler** ou en fin de morceau (détection approximative via la position du lecteur).

## Déploiement Vercel

- Ajoute les mêmes variables d’environnement.
- Mets `NEXT_PUBLIC_APP_URL` et `SPOTIFY_REDIRECT_URI` sur l’URL de production (`https://…/api/spotify/callback`).
- Ajoute ce redirect dans l’app Spotify.

## Sécurité (V1 perso)

- **Admin** : cookie httpOnly signé (mot de passe + `ADMIN_SESSION_SECRET`). À remplacer plus tard par une vraie auth (Supabase Auth, etc.) si tu ouvres l’app.
- **Spotify** : tokens en cookies httpOnly ; rafraîchissement côté serveur sur les routes API.
- Les métadonnées « révélation » sont servies par `GET /api/play/[slug]/reveal` : toute personne avec le lien peut les obtenir (lien secret = sécurité légère). Renforce avec un jeton si besoin.

## Scripts npm

- `npm run dev` — développement
- `npm run build` / `npm run start` — production locale
- `npm run lint` — ESLint
