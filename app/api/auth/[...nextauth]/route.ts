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
        try{
          // const existingUser = await db.user.findUnique({ 
          //   where: { email: user.email } 
          // });

          // if (!existingUser) {
          //   await db.user.create({
          //     data: {
          //       email: profile.email,
          //       name: profile.name,
          //       image: profile.picture,
          //     }
            // });
            return true;
          }
         catch (error) {
          console.log("Error in signin callback", error);
          return false;
        }
      }
      return true;
    },

    async jwt({token, user, trigger}){

      if(user){
        token.id = user.id
      }
      return token
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