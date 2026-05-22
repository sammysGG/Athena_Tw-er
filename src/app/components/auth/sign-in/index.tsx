"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/app/components/layout/logo";

const Signin = () => {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="relative w-full pt-32 pb-20 flex items-center justify-center dark:bg-baseInk">
        <div className="container">
          <div className="mx-auto max-w-md dark:bg-surfaceDark border border-gray-200 dark:border-white/10 shadow-xl rounded-md px-6 py-10 text-center sm:px-12">
            <div className="mb-8 flex justify-center">
              <Logo />
            </div>

            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-navyGray/70 dark:text-white/60 text-sm mb-6">
              Sign in to post, like, and comment.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <input
                type="email"
                placeholder="Email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="input-class"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                className="input-class"
                autoComplete="current-password"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 font-medium rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-navyGray/80 dark:text-white/70 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
