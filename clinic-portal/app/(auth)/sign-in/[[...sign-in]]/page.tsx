"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("auth/login", data);
      localStorage.setItem("token", res.data.token);

      login(res.data.token, res.data.user);

      // Redirect based on role
      if (res.data.user.role === "patient") router.push("/patient");
      else if (res.data.user.role === "doctor") router.push("/doctor");
      else if (res.data.user.role === "admin") router.push("/admin");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center relative">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-lg rounded-xl p-6 w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Login</h2>

        <div>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className="w-full p-2 border rounded-md"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full p-2 border rounded-md"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {/* Below form footer with register link */}
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Not a registered user?</span>
          <Link
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
