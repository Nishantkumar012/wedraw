import { useState } from 'react'
// import AuthButton from '../components/AuthButton'
import { Button } from '../../shared/components/Button'
// import InputField from '../..//shared/components/InputField'
import { InputField } from '../../shared/components/InputField'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  // Plus,
  // Trash,
  // Pencil,  
  // LogOut,
  // FileText,
  // LockIcon,
  // User,
  // User2Icon,
  UserRound,
} from 'lucide-react'
// import { signupUser } from '../services/authService'

function Signup() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    // try {
    //   const res = await signupUser({
    //     name: form.name,
    //     email: form.email,
    //     password: form.password,
    //   })

    //   console.log(res.data)
    //   navigate('/login')
    // } catch (error) {
    //   console.log(error)
    // }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-slate-50 p-8 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Join Whiteboard pro to start collaborating with your team in real-time
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
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

          {/* <button className="w-full mt-5 bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600">
            Create Account
          </button> */}

         <Button fullWidth>
  Create Account
</Button>


              {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="text-sm text-gray-500">or continue with</p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>


            {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            
            <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
              />
              Google
            </button>

            <button className="flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
              <img
                src="https://www.svgrepo.com/show/448234/linkedin.svg"
                className="w-5 h-5"
              />
              Linkedin
            </button>

          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-primary font-medium cursor-pointer hover:underline"
            >
              Sign up
            </span>
          </p>

        </form>
      </div>
    </div>
  );
}


export default Signup
