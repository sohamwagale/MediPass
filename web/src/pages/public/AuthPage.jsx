import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Shield, UserPlus, ArrowRight } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import "./AuthPage.css"




const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient"
  })




  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const role = searchParams.get("role")
    const mode = searchParams.get("mode")

    if (role) {
      setFormData(prev => ({ ...prev, role }))
    }

    if (mode === "signup") setIsSignup(true)
    if (mode === "login") setIsSignup(false)

  }, [])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const { login, signup, isLoading } = useAuthStore()

  async function handleAuth(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let result

      if (isSignup) {
        result = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: ''
        })
      } else {
        result = await login(formData.email, formData.password, formData.role)
      }

      if (result.success) {
        const redirectTo = formData.role || "patient"
        navigate(`/${redirectTo}`)
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">
            {isSignup ? <UserPlus size={34} /> : <Shield size={34} />}
          </div>
          <h1>{isSignup ? "Join MediPass" : "Welcome Back"}</h1>
          <p>
            {isSignup
              ? "Create your secure health identity"
              : "Access your secure health records"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">

          {isSignup && (
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="patient">👤 Patient</option>
              <option value="doctor">👨‍⚕️ Doctor</option>
            </select>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="main-btn" disabled={loading || isLoading}>
            {(loading || isLoading)
              ? "Please wait..."
              : isSignup ? "Create Account" : "Sign In"}
            {!(loading || isLoading) && <ArrowRight size={18} />}
          </button>

        </form>

        <p className="footer-text">
          {isSignup ? "Already have an account?" : "New to MediPass?"}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? " Sign In" : " Create one"}
          </span>
        </p>

      </div>
    </div>
  )
}

export default AuthPage
