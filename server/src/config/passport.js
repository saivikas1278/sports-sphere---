import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our db
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // If user exists, but doesn't have google id, you could link them
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }
      
      // If not, create a new user in our db
      user = await User.create({
        googleId: profile.id,
        firstName: profile.name.givenName || profile.displayName,
        lastName: profile.name.familyName || '-',
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        role: 'player' // default role
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
));

export default passport;
