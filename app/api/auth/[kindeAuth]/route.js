import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

// Handle all Kinde authentication routes with specific redirect configurations
export const GET = handleAuth({  
  // After authentication is complete, redirect to the patient dashboard
  // This works for both login and registration
  postLoginRedirectURL: "/patient/dashboard", 
  
  // After logout, redirect back to the login page
  logoutURL: "/auth/login"
});
