import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
} from 'passport-google-oauth20';
import { AuthService } from '@user-service/services/auth.service';
import googleConfig from '@user-service/config/google.config';
import { logger } from '@user-service/common';

// Stateless (no sessions) — Google only identifies the user, our own JWT
// remains the session token for every service.
export const createGoogleStrategy = (authService: AuthService) =>
  new GoogleStrategy(
    {
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackUrl,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('Google account has no email address'));
        }

        const user = await authService.findOrCreateGoogleUser({
          googleId: profile.id,
          email,
        });

        return done(null, user);
      } catch (error) {
        logger.error('Google sign-in failed:', error);
        return done(error as Error);
      }
    }
  );

export { passport };
