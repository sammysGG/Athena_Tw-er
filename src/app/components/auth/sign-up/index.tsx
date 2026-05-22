"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Logo from "@/app/components/layout/logo";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.displayName.trim()) return setError("Display name required");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
      return setError("Username must be 3-20 chars (letters, numbers, underscore)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Enter a valid email");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign up failed");
        return;
      }
      const signin = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (!signin || signin.error) {
        router.push("/sign-in");
        return;
      }
      router.push("/");
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

            <h1 className="text-2xl font-bold mb-1">Register to be a tw@ today</h1>
            <p className="text-navyGray/70 dark:text-white/60 text-sm mb-6">
              Tw@er — Where OPSEC goes to die.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <input
                type="text"
                placeholder="Display name"
                value={form.displayName}
                onChange={setField("displayName")}
                className="input-class"
                maxLength={50}
              />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={setField("username")}
                className="input-class"
                maxLength={20}
                autoComplete="username"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={setField("email")}
                className="input-class"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password (6+ chars)"
                value={form.password}
                onChange={setField("password")}
                className="input-class"
                autoComplete="new-password"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 font-medium rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-6 text-navyGray/80 dark:text-white/70 text-sm">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
