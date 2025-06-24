import Auth0 from 'react-native-auth0';
import auth0Config from '../config/authConfig';

const auth0 = new Auth0({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
});

export default auth0;