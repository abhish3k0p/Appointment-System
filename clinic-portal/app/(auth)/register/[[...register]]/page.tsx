"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await api.post("/auth/register", data);
      // Auto-login after register
      login(res.data.token, res.data.user);

      // Redirect to patient dashboard
      router.push("/patient");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center relative">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-lg rounded-xl p-6 w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Register</h2>

        <div>
          <input
            type="text"
            placeholder="Name"
            {...register("name")}
            className="w-full p-2 border rounded-md"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

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

        <div>
          <input
            type="tel"
            placeholder="Phone Number"
            {...register("phone")}
            className="w-full p-2 border rounded-md"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        {/* Below form footer with login link */}
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Already registered?</span>
          <Link
            href="/sign-in"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
