import { useState } from 'react'
import { Button } from '../../shared/components/Button'
import { InputField } from '../../shared/components/InputField'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import { Mail, Lock, Eye, UserRound } from 'lucide-react'

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const { login } = useAuthStore();
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError("");
    try {
      const res = await api.post("/user/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (res.data.token) {
        login(res.data.token);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    }
  }

  const handleGuestLogin = () => {
    const guestToken = import.meta.env.VITE_GUEST_TOKEN;
    if (guestToken) {
      useAuthStore.getState().setGuestToken(guestToken);
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-slate-50 p-8 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Join Whiteboard pro to start collaborating with your team in real-time
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="p-2 bg-red-50 text-red-600 text-sm rounded text-center">{error}</div>}
          <InputField
            label="Full name"
            type="text"
            placeholder="Full name"
            icon={UserRound}
            value={form.name}
            name="name"
            onChange={handleChange}
          />
          <InputField
            label="Email"
            type="text"
            placeholder="name@gmail.com"
            icon={Mail}
            value={form.email}
            name="email"
            onChange={handleChange}
          />
          <InputField
            label="password"
            type="password"
            placeholder="Password"
            icon={Lock}
            rightIcon={Eye}
            value={form.password}
            name="password"
            onChange={handleChange}
          />

          <Button fullWidth size="lg">Create Account</Button>
        </form>

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
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="text-primary font-medium cursor-pointer hover:underline">
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
