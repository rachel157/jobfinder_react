import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthClient } from "../services/authClient"

const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/

export default function Register() {
  const [tab, setTab] = useState("candidate") // candidate | recruiter
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    company: "",
  })
  const [showPass, setShowPass] = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const openDatePicker = (e) => {
    if (typeof e.target.showPicker === "function") {
      e.target.showPicker()
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!form.name || !form.email || !form.password || !form.confirm_password || !form.date_of_birth) {
      setError("Vui long dien day du thong tin bat buoc.")
      return
    }
    const hasSpecial = passwordSpecial.test(form.password)
    if (form.password.length < 10 || !hasSpecial) {
      setError("Mat khau phai dai toi thieu 10 ky tu va chua ky tu dac biet.")
      return
    }
    if (form.password !== form.confirm_password) {
      setError("Xac nhan mat khau khong khop.")
      return
    }
    setLoading(true)
    try {
      const role = tab === "recruiter" ? "recruiter" : "candidate"
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        role,
        date_of_birth: form.date_of_birth,
      }
      await AuthClient.register(payload)
      setSuccess("Da dang ky thanh cong. Vui long kiem tra email de xac thuc tai khoan roi quay lai dang nhap.")
    } catch (err) {
      setError(err?.data?.message || err?.message || "Dang ky that bai.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const wantedRole = params.get("role")
    if (wantedRole === "recruiter" || wantedRole === "employer") setTab("recruiter")
    if (wantedRole === "candidate" || wantedRole === "seeker") setTab("candidate")
  }, [params])

  return (
    <section className="section" style={{ maxWidth: 920, margin: "40px auto" }}>
      <div className="card auth-card auth-grid">
        <div className="auth-side">
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand-badge">JF</span>
            <span>JobFinder</span>
          </div>
          <h2 style={{ margin: "0 0 6px" }}>Tao tai khoan</h2>
          <div className="muted">Gia nhap cong dong nhan tai va nha tuyen dung chat luong.</div>
          <ul className="auth-points">
            <li>Ung tuyen / Dang tuyen de dang</li>
            <li>Goi y phu hop theo ho so</li>
            <li>Quan ly don ung tuyen thuan tien</li>
          </ul>
        </div>

        <div className="auth-form">
          <div className="tabs">
            <button className={"tab" + (tab === "candidate" ? " active" : "")} onClick={() => setTab("candidate")}>
              Ung vien (Candidate)
            </button>
            <button className={"tab" + (tab === "recruiter" ? " active" : "")} onClick={() => setTab("recruiter")}>
              Nha tuyen dung (Recruiter)
            </button>
          </div>

          <form onSubmit={onSubmit} className="form-grid">
            <label className="field">
              <span>Ho va ten</span>
              <input name="name" value={form.name} onChange={onChange} placeholder="Nguyen Van A" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Mat khau</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <input
                  style={{ flex: 1 }}
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="**********"
                  required
                />
                <button type="button" className="btn" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? "An" : "Hien"}
                </button>
              </div>
              {form.password && (form.password.length < 10 || !passwordSpecial.test(form.password)) && (
                <div className="field-error">Mat khau phai dai toi thieu 10 ky tu va chua ky tu dac biet.</div>
              )}
            </label>
            <label className="field">
              <span>Xac nhan mat khau</span>
              <input
                name="confirm_password"
                type={showPass ? "text" : "password"}
                value={form.confirm_password}
                onChange={onChange}
                placeholder="**********"
                required
              />
              {form.confirm_password && form.confirm_password !== form.password && (
                <div className="field-error">Mat khau khong khop.</div>
              )}
            </label>

            <label className="field">
              <span>Ngay sinh</span>
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={onChange}
                onClick={openDatePicker}
                onFocus={openDatePicker}
                required
              />
            </label>

            {success && <div className="success-banner">{success}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn primary large">
                {loading ? "Dang dang ky..." : "Dang ky"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
