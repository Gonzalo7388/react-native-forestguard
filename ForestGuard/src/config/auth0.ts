// src/config/auth0.ts
import Auth0 from 'react-native-auth0';
import authConfig from './authConfig';

const auth0 = new Auth0({
  domain: authConfig.domain,
  clientId: authConfig.clientId,
});

export default auth0;
