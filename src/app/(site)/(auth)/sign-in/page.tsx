import { Suspense } from "react";
import Signin from "@/app/components/auth/sign-in";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Tw@er",
};

const SignInPage = () => (
  <Suspense fallback={null}>
    <Signin />
  </Suspense>
);

export default SignInPage;
