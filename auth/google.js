import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import 'dotenv/config'
import { User } from "../models/user.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Try to find user by googleId
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          email: profile.emails?.[0]?.value,
          isVerified: true
        });
      }
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});