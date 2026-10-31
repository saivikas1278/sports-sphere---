import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

export const isGoogleConfigured = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientID &&
    clientSecret &&
    clientID !== 'your_google_client_id' &&
    clientID !== 'mock_client_id' &&
    clientSecret !== 'your_google_client_secret' &&
    clientSecret !== 'mock_client_secret'
  );
};

if (isGoogleConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // Create a new user
          user = await User.create({
            googleId: profile.id,
            firstName: profile.name?.givenName || profile.displayName || 'Google',
            lastName: profile.name?.familyName || 'User',
            email,
            avatar: profile.photos?.[0]?.value || null,
            role: 'player'
          });

          // Create profile for new user
          const userProfile = new Profile({
            user: user._id,
            preferences: {
              sports: [],
              notifications: {
                email: true,
                push: true,
                sms: false,
                types: {
                  likes: true,
                  comments: true,
                  follows: true,
                  teamInvites: true,
                  tournamentUpdates: true,
                  matchUpdates: true
                }
              },
              privacy: {
                profileVisibility: 'public',
                showEmail: false,
                showPhone: false,
                showLocation: true
              }
            }
          });
          await userProfile.save();

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy registered successfully.');
} else {
  console.log('ℹ️ Google OAuth credentials missing; Google authentication is safely disabled.');
}

export default passport;
