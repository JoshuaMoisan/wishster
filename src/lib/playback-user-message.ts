/**
 * Transforme les erreurs techniques (SDK, API, réseau) en texte lisible pour
 * les joueurs sur /play/[slug].
 */
export type PlaybackUserExplanation = {
  title: string;
  body: string;
};

function norm(s: string): string {
  return s.toLowerCase();
}

export function explainPlaybackFailure(raw: string): PlaybackUserExplanation {
  const n = norm(raw);

  if (!raw.trim()) {
    return {
      title: "Lecture impossible",
      body: "Une erreur inattendue s’est produite. Réessaie dans un instant.",
    };
  }

  if (
    n.includes("premium") ||
    n.includes("subscription") ||
    n.includes("account_error") ||
    n.includes("only premium") ||
    n.includes("restricted")
  ) {
    return {
      title: "Spotify Premium requis",
      body:
        "La lecture dans le navigateur (Web Player) n’est disponible qu’avec un abonnement Spotify Premium. Les comptes gratuits ne peuvent pas utiliser ce lecteur : ouvre le morceau dans l’application Spotify à la place, ou passe en Premium.",
    };
  }

  if (
    n.includes("non connecté") ||
    n.includes("connecte-toi") ||
    n.includes("401") ||
    n.includes("authentication") ||
    n.includes("authentification") ||
    n.includes("reconnecte") ||
    n.includes("session") ||
    n.includes("jeton") ||
    n.includes("token")
  ) {
    return {
      title: "Connexion Spotify",
      body:
        "Ta session Spotify a expiré ou le navigateur n’a pas reçu d’autorisation. Reconnecte-toi à Spotify (bouton sur cette page ou depuis l’accueil), puis réessaie de lancer la musique.",
    };
  }

  if (
    n.includes("device") ||
    n.includes("404") ||
    n.includes("not found") ||
    n.includes("transfert") ||
    n.includes("lecteur non prêt") ||
    n.includes("no active") ||
    n.includes("appareil") ||
    (n.includes("ne trouve pas") && n.includes("lecteur"))
  ) {
    return {
      title: "Lecteur du navigateur introuvable",
      body:
        "Spotify n’a pas trouvé le lecteur intégré à cette page. Attends quelques secondes après avoir cliqué sur « Lancer la musique », recharge la page, ou vérifie qu’aucun bloqueur de contenu ne bloque le lecteur. Sur mobile, privilégie souvent l’app Spotify.",
    };
  }

  if (
    n.includes("403") ||
    n.includes("restriction") ||
    n.includes("market") ||
    n.includes("country") ||
    n.includes("not available")
  ) {
    return {
      title: "Morceau non disponible",
      body:
        "Spotify refuse la lecture de ce titre (région, droits, ou type de compte). Tu peux essayer depuis l’app Spotify ou un autre appareil.",
    };
  }

  if (n.includes("429") || n.includes("rate limit")) {
    return {
      title: "Trop de tentatives",
      body:
        "Spotify limite temporairement les demandes. Attends une minute puis réessaie.",
    };
  }

  if (
    n.includes("sdk") ||
    n.includes("script") ||
    n.includes("timeout") ||
    n.includes("délai dépassé") ||
    n.includes("chargement") ||
    n.includes("connexion au lecteur refusée")
  ) {
    return {
      title: "Lecteur Spotify du navigateur",
      body:
        "Le lecteur intégré n’a pas pu démarrer (réseau lent, extension, ou navigateur trop ancien). Réessaie, désactive un instant le bloqueur de pubs, ou ouvre le morceau dans l’app Spotify.",
    };
  }

  if (n.includes("502") || n.includes("503") || n.includes("réseau")) {
    return {
      title: "Problème temporaire",
      body:
        "Le service Spotify ou notre serveur ne répond pas correctement. Réessaie dans quelques instants.",
    };
  }

  if (n.includes("lecture impossible") || n.includes("play")) {
    return {
      title: "Spotify n’a pas lancé la lecture",
      body:
        raw.length > 180
          ? `${raw.slice(0, 180)}…`
          : raw ||
            "Réessaie ou ouvre le morceau dans l’application Spotify (icône ci-dessous).",
    };
  }

  return {
    title: "La musique ne démarre pas",
    body:
      raw.length > 220
        ? `${raw.slice(0, 220)}…`
        : raw ||
          "Réessaie dans un instant. Si ça persiste, ouvre le morceau dans l’app Spotify.",
  };
}

/** `spotify:track:xxx` → lien ouverture Spotify Web / app. */
export function spotifyWebOpenUrl(spotifyUri: string): string | null {
  const m = /^spotify:track:([a-zA-Z0-9]+)$/i.exec(spotifyUri.trim());
  if (!m) return null;
  return `https://open.spotify.com/track/${encodeURIComponent(m[1])}`;
}
