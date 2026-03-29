import { useState } from "react";
import { InputField } from "../../shared/components/InputField";
import { Button } from "../../shared/components/Button";
import { Mail, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const { login } = useAuthStore();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/user/login", form);
      if (res.data.token) {
        login(res.data.token);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGuestLogin = () => {
    const guestToken = import.meta.env.VITE_GUEST_TOKEN;
    if (guestToken) {
      useAuthStore.getState().setGuestToken(guestToken);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center text-sm text-gray-500">Securely access your account</p>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded text-center">{error}</div>}

        {/* Form */}
        <form className="space-y-5 mt-4" onSubmit={handleSubmit}>
          <InputField
            label="Email Address"
            type="email"
            placeholder="name@gmail.com"
            icon={Mail}
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="Password"
            icon={Lock}
            rightIcon={Eye}
            name="password"
            value={form.password}
            onChange={handleChange}
          />
          <div className="flex justify-end -mt-2">
            <span className="text-sm text-primary cursor-pointer hover:underline">Forgot password?</span>
          </div>
          <Button fullWidth size="lg">Log in</Button>
        </form>

        {/* Moved Outside Form to prevent submit */}
        <div className="mt-4">
          <Button variant="secondary" fullWidth size="lg" onClick={handleGuestLogin}>
            Continue as Guest
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <p className="text-sm text-gray-500">or continue with</p>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
            Google
          </button>
          <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
            <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-5 h-5" />
            Linkedin
          </button>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-sm">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")} className="text-primary font-medium cursor-pointer hover:underline">
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;