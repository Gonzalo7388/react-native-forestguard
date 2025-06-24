import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true, // esto fuerza que se use el proxy de Expo
}as any);

const auth0Config = {
  domain: 'dev-4mouz2fm57r73pyi.us.auth0.com',
  clientId: 'kAAqdg5RnwDZw6SlTpcG6pBIXkDnIvhfD',
  redirectUri, // importante: este debe ser con proxy si usas Expo Go
};

export default auth0Config;
