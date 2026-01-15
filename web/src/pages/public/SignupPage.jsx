import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import {
  ArrowRight,
  UserPlus,
  User,
  Stethoscope,
} from "lucide-react"

const SignupPage = () => {
  const navigate = useNavigate()
  const { signup } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill all required fields")
      return
    }

    try {
      setIsLoading(true)
      const result = await signup(formData)

      if (result?.success === false) {
        alert(result.error || "Signup failed")
        return
      }

      navigate(`/${formData.role}`)
    } catch (err) {
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-primary-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-success-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <UserPlus className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-neutral-900 mb-3">
            Join MediPass
          </h1>
          <p className="text-neutral-600">
            Create your secure healthcare account
          </p>
        </div>

        {/* Role Selection */}
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "patient" })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition ${
              formData.role === "patient"
                ? "bg-primary-600 text-white border-primary-600"
                : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <User className="w-5 h-5" />
            Patient
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "doctor" })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition ${
              formData.role === "doctor"
                ? "bg-primary-600 text-white border-primary-600"
                : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Stethoscope className="w-5 h-5" />
            Doctor
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none"
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none"
            required
          />

          <input
            type="tel"
            placeholder="Phone (Optional)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none"
            required
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary-600 text-white text-lg font-semibold hover:bg-primary-700 transition disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}

export default SignupPage
