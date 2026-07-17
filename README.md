# PSM Mobile (Patient) — Phase 1

App React Native (Expo, TypeScript, Expo Router) pour l'espace patient de PSM. Consomme la même API NestJS que le web (`my-health-journal-api`) — aucune modification backend nécessaire.

Voir le plan complet : `C:\Users\pc\.claude\plans\twinkly-rolling-wand.md`.

## Écrans livrés (Phase 1)

- Auth patient : inscription (3 étapes) + connexion (téléphone/PIN → OTP SMS)
- Navigation par onglets : Accueil, Dossier, RDV, Plus
- **Dashboard** : résumé carnet, stats, graphique tension, dernière consultation
- **Dossier** : consultations, antécédents, examens (lecture)
- **RDV** : liste (à venir/historique) + annulation avec confirmation OTP
- **RDV → Nouveau** : parcours complet de prise de RDV en ligne (recherche → créneau → paiement → confirmation), branché sur le module `booking` de l'API
- **Plus** : déconnexion + liste des 8 écrans restants (Ordonnances, Examens, Suivi/Nutrition, Vaccinations, Assurances, Accès, Journal, Profil) marqués "Bientôt disponible" — Phase 2

## Lancer en dev

1. Démarrer l'API NestJS (`my-health-journal-api`) : `npm run dev` (écoute sur `:4000`).
2. Vérifier `.env` à la racine de ce projet : `EXPO_PUBLIC_API_URL` doit pointer vers l'IP LAN de la machine (pas `localhost` — inatteignable depuis un téléphone/émulateur). Valeur déjà pré-remplie avec l'IP Wi-Fi détectée au moment du setup ; à mettre à jour si elle change.
3. `npm start` puis scanner le QR code avec l'app **Expo Go** (même réseau Wi-Fi que la machine).
   - Émulateur Android Studio : utiliser `http://10.0.2.2:4000/api` à la place dans `.env`.

## Générer un APK

Aucun SDK Android n'est installé sur cette machine → build via **EAS** (cloud, gratuit pour Android) :

```
npx eas login          # compte Expo (gratuit) — à créer si besoin
npx eas build:configure
npx eas build -p android --profile preview
```

Le profil `preview` (`eas.json`) produit un `.apk` installable directement (pas un `.aab` réservé au Play Store). Le lien de téléchargement s'affiche en fin de build (aussi visible sur expo.dev).

Si Android Studio est installé plus tard, alternative locale possible :
```
npx expo prebuild
cd android && ./gradlew assembleDebug
```

## Notes

- Icônes app (`assets/*.png`) sont les icônes par défaut Expo — à remplacer par les assets PSM quand disponibles.
- `android.package` / `ios.bundleIdentifier` réglés sur `ci.psm.mobile` (à ajuster si un identifiant définitif existe déjà).
