import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value;

        if (!email) return done(new Error('No email from Google'));

        const existing = await prisma.admin.findUnique({ where: { email } });

        if (existing) {
          // Allow Google login for any existing admin — don't touch password or provider
          const updated = await prisma.admin.update({
            where: { email },
            data: {
              provider: 'GOOGLE',
              profile_image: picture ?? existing.profile_image,
              last_login_at: new Date(),
            },
          });
          return done(null, updated as any);
        }

        // New user — only allow if first admin
        const adminCount = await prisma.admin.count({ where: { email_verified: true } });
        if (adminCount > 0) {
          return done(null, false, { message: 'access_denied' });
        }

        const newAdmin = await prisma.admin.create({
          data: {
            name,
            email,
            provider: 'GOOGLE',
            profile_image: picture,
            email_verified: true,
            role: 'MAIN',
            can_register_admin: true,
            can_access_admin_panel: true,
          },
        });
        return done(null, newAdmin as any);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
