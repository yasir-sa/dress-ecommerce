import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma';

passport.use(
  'google-customer',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.CUSTOMER_GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value;

        if (!email) return done(new Error('No email from Google'));

        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
          const updated = await prisma.user.update({
            where: { email },
            data: {
              provider: 'GOOGLE',
              profile_image: picture ?? existing.profile_image,
              last_login_at: new Date(),
              email_verified: true,
            },
          });
          return done(null, updated as any);
        }

        // New customer — create in users table
        const newUser = await prisma.user.create({
          data: {
            name: name ?? '',
            email,
            provider: 'GOOGLE',
            profile_image: picture,
            email_verified: true,
          },
        });
        return done(null, newUser as any);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
