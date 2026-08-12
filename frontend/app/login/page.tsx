"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import appLogo from "../../Logos-01.png"
import loginSideImage from "../../main-campus.jpg"

const QUICK_LOGIN_USERS = [
  "supervisor_sara",
  "superadmin.luan",
  "finance.elira",
  "admin23",
  "studaff.keti",
  "admissions.era",
  "advisor.omer",
  "security.dani",
  "facilities.rina",
  "dean.petra",
  "it.bora",
  "ta.noel",
  "registrar.rei",
  "hod.cs",
  "hod.ds",
  "hod.biz",
  "library.riela",
  "hr.gerta",
  "taha",
  "anasprof",
  "memo",
  "anas",
  "test1",
  "student1",
  "test2y",
]
const QUICK_LOGIN_PASSWORD = "Test@1234"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("ar_company_remember") === "true"
  })
  const [username, setUsername] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("ar_company_username") ?? ""
  })
  const [password, setPassword] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [pendingCredentials, setPendingCredentials] = useState<{ username: string; password: string } | null>(null)

  useEffect(() => {
    if (!isLoading && user) {
      router.push(user.role === "student" ? "/student" : "/dashboard")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    try {
      if (rememberMe) {
        localStorage.setItem("ar_company_remember", "true")
      } else {
        localStorage.removeItem("ar_company_remember")
      }
    } catch (storageError) {
      console.warn("Unable to persist remember preference", storageError)
    }
  }, [rememberMe])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setError("")
    setForgotMessage("")

    let currentUsername: string
    let password: string

    if (mfaStep && pendingCredentials) {
      currentUsername = pendingCredentials.username
      password = pendingCredentials.password
    } else {
      const formData = new FormData(event.currentTarget)
      currentUsername = String(formData.get("username") ?? "")
      password = String(formData.get("password") ?? "")

      try {
        if (rememberMe) {
          localStorage.setItem("ar_company_username", currentUsername)
        } else {
          localStorage.removeItem("ar_company_username")
        }
      } catch (storageError) {
        console.warn("Unable to persist username", storageError)
      }
    }

    const result = await login(currentUsername, password, rememberMe, mfaStep ? mfaCode : undefined)

    if (result === "success") {
      setIsSubmitting(false)
      return
    }

    if (result === "mfa-required") {
      setMfaStep(true)
      setPendingCredentials({ username: currentUsername, password })
      setError("")
      setIsSubmitting(false)
      return
    }

    if (mfaStep) {
      setError("Invalid authentication code. Please try again.")
      setIsSubmitting(false)
      return
    }

    setError("Invalid credentials. Please try again.")
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#06131f_0%,#0a2231_52%,#10283c_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <Image src={appLogo} alt="AR University logo" fill priority className="object-cover" />
          </div>
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/15" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#051018_0%,#081d2b_45%,#0b2331_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-[48px] rotate-12 bg-[linear-gradient(135deg,rgba(8,89,110,0.36),rgba(4,26,40,0.08))] blur-3xl" />
        <div className="absolute left-[8%] top-[18%] h-32 w-32 rotate-12 rounded-[24px] border border-[#d5ab54]/20 bg-[linear-gradient(135deg,rgba(212,168,74,0.22),rgba(212,168,74,0.03))] shadow-[0_0_60px_rgba(212,168,74,0.08)]" />
        <div className="absolute right-[10%] top-[12%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(240,201,104,0.24),rgba(240,201,104,0.02)_62%)] blur-2xl" />
        <div className="absolute right-[6%] top-[24%] h-36 w-36 rotate-[32deg] rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(22,54,78,0.7),rgba(7,18,29,0.28))]" />
        <div className="absolute left-[14%] bottom-[14%] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(159,228,255,0.22),rgba(159,228,255,0.02)_68%)] blur-xl" />
        <div className="absolute right-[18%] bottom-[10%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(10,119,144,0.18),rgba(10,119,144,0.02)_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(212,168,74,0.06)_28%,transparent_40%,transparent_100%)]" />
        <div className="absolute inset-y-0 left-[18%] w-px bg-[linear-gradient(180deg,transparent,rgba(212,168,74,0.38),transparent)]" />
        <div className="absolute inset-y-0 right-[22%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/12 bg-white/8 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_30%,rgba(255,255,255,0.03)_100%)]" />
          <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_68%)] blur-2xl" />
          <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(212,168,74,0.14),rgba(212,168,74,0.02)_70%)] blur-2xl" />

          <div className="relative grid min-h-[720px] lg:grid-cols-[1fr_500px]">
            <aside className="relative hidden overflow-hidden lg:flex">
              <Image
                src={loginSideImage}
                alt="University of New York Tirana campus"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,20,31,0.48),rgba(6,22,33,0.78))]" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,29,44,0.12),rgba(212,168,74,0.10),rgba(5,14,24,0.66))]" />

              <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
              <div className="space-y-8">
                <div className="flex items-center gap-[26px]">
                  <div className="flex items-center gap-[11px]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-white p-[5px]">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/en/8/85/Logo_of_the_University_of_New_York%E2%80%93Tirana.svg"
                        alt="UNYT"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="leading-[1.12]">
                      <div className="text-[12.5px] font-bold tracking-[0.02em] text-[#dbe6f7]">UNIVERSITY OF</div>
                      <div className="text-[12.5px] font-bold tracking-[0.02em] text-[#dbe6f7]">NEW YORK TIRANA</div>
                    </div>
                  </div>
                  <div className="h-[34px] w-px bg-white/18" />
                  <div className="flex items-center gap-[10px]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white p-[5px]">
                      <img
                        src="https://cdncloudcart.com/40816/files/image/bullet.png?1699272775"
                        alt="Maarif"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-[9px] font-bold leading-[1.15] tracking-[0.08em] text-[#bfeae5]">
                      TURKISH MAARIF<br />FOUNDATION
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#e5c277]">UNYT Portal</p>
                  <h1 className="max-w-[420px] text-5xl font-black leading-[0.92] tracking-[-0.04em] text-white">
                    Secure access for the UNYT portal.
                  </h1>
                  <p className="max-w-[360px] text-sm leading-7 text-white/74">
                    Sign in with your university credentials to continue.
                  </p>
                </div>

                <div className="pt-65">
                  <div className="max-w-[420px] rounded-[24px] border border-white/10 bg-white/7 p-5 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e5c277]">Protected Access</p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    University credentials route you to the correct student or staff workspace automatically.
                  </p>
                </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm text-white/58">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-[#e5c277]" />
                  <span>Encrypted university login flow</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.24em] text-white/38">© 2026 UNYT</span>
              </div>
              </div>
            </aside>

            <main className="relative flex items-center justify-center p-5 sm:p-8 lg:p-8">
              <div className="w-full max-w-[468px] rounded-[30px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] p-6 shadow-[0_32px_90px_-50px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:p-8">
                <div className="mb-6 flex items-center justify-between lg:hidden">
                  <div className="max-w-[180px]">
                    <Image src={appLogo} alt="University of New York Tirana" priority className="h-auto w-full brightness-[1.22]" />
                  </div>
                  <Link href="/">
                    <Button variant="outline" className="gap-2 rounded-full border-white/16 bg-white/10 px-4 text-white shadow-none hover:bg-white/16">
                      <ArrowLeft className="h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>

                <div className="mb-5 hidden justify-end lg:flex">
                  <Link href="/">
                    <Button variant="outline" className="gap-2 rounded-full border-white/16 bg-white/10 px-4 text-white shadow-none hover:bg-white/16">
                      <ArrowLeft className="h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>

                <div className="mb-8 text-center lg:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#e5c277]">Login</p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Welcome back</h2>
                  <p className="mx-auto mt-3 max-w-[320px] text-sm leading-7 text-white/70 lg:mx-0">
                    Enter your university credentials to continue to the portal.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mfaStep ? (
                    <div className="space-y-2">
                      <Label htmlFor="mfaCode" className="text-sm font-semibold text-white/86">Authentication code</Label>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                        <Input
                          id="mfaCode"
                          name="mfaCode"
                          value={mfaCode}
                          onChange={(event) => setMfaCode(event.target.value)}
                          placeholder="6-digit code"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          autoFocus
                          required
                          className="h-14 rounded-[20px] border border-white/12 bg-white/10 pl-12 pr-5 text-lg text-white placeholder:text-white/45 shadow-none focus-visible:border-[#e5c277]/50 focus-visible:ring-[3px] focus-visible:ring-[#e5c277]/16"
                        />
                      </div>
                      <p className="text-xs text-white/58">Enter the code from your authenticator app.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-semibold text-white/86">Email</Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                          <Input
                          id="username"
                          name="username"
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          placeholder="Enter your email"
                          autoComplete="username"
                          required
                          className="h-14 rounded-[20px] border border-white/12 bg-white/10 pl-12 pr-5 text-lg text-white placeholder:text-white/45 shadow-none focus-visible:border-[#e5c277]/50 focus-visible:ring-[3px] focus-visible:ring-[#e5c277]/16"
                        />
                      </div>
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-white/86">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            className="h-14 rounded-[20px] border border-white/12 bg-white/10 pl-12 pr-14 text-lg text-white placeholder:text-white/45 shadow-none focus-visible:border-[#e5c277]/50 focus-visible:ring-[3px] focus-visible:ring-[#e5c277]/16"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((previous) => !previous)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 transition-colors hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Quick fill (dev)</p>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_LOGIN_USERS.map((quickUsername) => (
                            <button
                              key={quickUsername}
                              type="button"
                              onClick={() => {
                                setUsername(quickUsername)
                                setPassword(QUICK_LOGIN_PASSWORD)
                              }}
                              className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs text-white/74 transition-colors hover:border-[#e5c277]/50 hover:text-[#e5c277]"
                            >
                              {quickUsername}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {mfaStep ? (
                    <div className="flex items-center justify-end pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMfaStep(false)
                          setMfaCode("")
                          setPendingCredentials(null)
                          setError("")
                        }}
                        className="font-medium text-white/64 transition-colors hover:text-[#e5c277]"
                      >
                        Back to login
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 pt-1 text-xs">
                      <label className="flex items-center gap-2 text-white/66">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-[#d5ab54] focus:ring-[#d5ab54]"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMessage("Please contact your advisor or administrator to reset your access.")
                          setError("")
                        }}
                        className="font-medium text-white/64 transition-colors hover:text-[#e5c277]"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}

                  {forgotMessage && (
                    <div className="rounded-[18px] border border-[#d5ab54]/20 bg-[#d5ab54]/10 px-4 py-3 text-sm text-white/84">
                      {forgotMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="mt-2 h-12 w-full rounded-[18px] bg-[linear-gradient(135deg,#d5ab54_0%,#b78830_100%)] text-base font-semibold text-[#07131d] shadow-[0_20px_40px_-22px_rgba(213,171,84,0.55)] hover:brightness-105"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : mfaStep ? "Verify code" : "Login"}
                  </Button>
                </form>

                <div className="mt-8 space-y-3 text-center text-[13px] text-white/58">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4 text-[#e5c277]" />
                    <span>admissions@unyt.edu.al</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4 text-[#e5c277]" />
                    <span>+355 4 4512345</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-center">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e5c277]" />
                    <span>Tirana, Albania</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
