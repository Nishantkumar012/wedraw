import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import { Mail, Lock, UserRound, ArrowRight } from 'lucide-react'

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const { login } = useAuthStore();
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError("");

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    try {
      const res = await api.post("/user/register", {
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
    <div className="flex min-h-screen items-center justify-center bg-[#F4FAFD]">
      <div className="w-full max-w-105 bg-[#F4FAFD] px-10 py-12 rounded-2xl raised-neumorphic">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-full pressed-neumorphic bg-[#E2E9EC]">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4352A5]">WeDraw</h2>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Start creating</h1>
        <p className="text-sm text-gray-500 mb-8">
          Join the collaborative whiteboard for teams
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center pressed-neumorphic">{error}</div>}

          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#F4FAFD] text-gray-800
                pressed-neumorphic
                focus:ring-2 focus:ring-blue-500/30
                outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#F4FAFD] text-gray-800
                pressed-neumorphic
                focus:ring-2 focus:ring-blue-500/30
                outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#F4FAFD] text-gray-800
                pressed-neumorphic
                focus:ring-2 focus:ring-blue-500/30
                outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600
              focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the{" "}
              <span className="text-blue-600 hover:underline">terms and conditions</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold
            raised-neumorphic hover:bg-blue-700 active:pressed-neumorphic transition-all
            flex items-center justify-center gap-2"
          >
            Create account
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Guest Login Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold
            raised-neumorphic hover:bg-gray-200 active:pressed-neumorphic transition-all"
          >
            Continue as Guest
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="text-blue-600 font-semibold cursor-pointer hover:underline">
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
