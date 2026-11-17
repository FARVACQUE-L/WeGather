# WeGather — application mobile

Application iOS / Android en React Native avec [Expo](https://expo.dev) et Expo Router.
Projet indépendant du monorepo npm : ses dépendances s'installent dans `mobile/`.

## Lancer en développement

```bash
cd mobile
npm install
npx expo start
```

Scanner le QR code avec l'application **Expo Go** (le téléphone et le PC doivent être sur le même Wi-Fi ;
sinon `npx expo start --tunnel`).

## Serveur visé

Par défaut l'app appelle `https://wegather.fr`. Pour viser un serveur local, créer `mobile/.env.local` :

```
EXPO_PUBLIC_API_URL=http://<ip-du-pc>:3310
```

## Vérifications

```bash
npx tsc --noEmit
npx expo-doctor
```

Ajouter une dépendance avec `npx expo install <paquet>` (versions compatibles avec le SDK).
