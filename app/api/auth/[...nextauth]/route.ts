import prisma from "@/lib/db";
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({user, account, profile}){
      if (account?.provider === "google") {
        if (!profile || !user.email) {
          return false;
        }
        try {
          const existingUser = await prisma.user.findUnique({ 
            where: { email: user.email } 
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: profile.email || user.email,
                name: profile.name || user.name,
                image: (profile as any).picture || profile.image || user.image,
              }
            });
          }
          return true;
        } catch (error) {
          console.log("Error in signin callback", error);
          return false;
        }
      }
      return true;
    },

    async jwt({token, user, trigger}){
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });
        if (dbUser) {
          token.id = dbUser.id;
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,

})

export { handler as GET, handler as POST } 