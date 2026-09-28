import env from '@user-service/config/env';

const googleConfig = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackUrl: env.GOOGLE_CALLBACK_URL,
  frontendUrl: env.FRONTEND_URL,
};

export type GoogleConfig = typeof googleConfig;

export default googleConfig;
