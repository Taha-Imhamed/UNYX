"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createFeedback } from "@/lib/feedback-api"
import { ArrowUpRight, BookOpen, BriefcaseBusiness } from "lucide-react"
import "./cinema.css"
import { useCinemaScroll } from "./use-cinema-scroll"

const SKY_URL = "https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png"
const BACK_FOUR_URL = "https://raft-blast-61784561.figma.site/_assets/v11/8a7f8af50e0ce92ec2e228e7b0b4112178c51cf1.png"
const BAZAAR_URL = "https://raft-blast-61784561.figma.site/_assets/v11/864afe00e41e2fa20a5aa546e15cb807e0f81384.png"
const SPLIT_LEFT_URL = "https://raft-blast-61784561.figma.site/_assets/v11/7536d7b60a1fce482cf6edf3f0bffd3bad5d0f8a.png"
const SPLIT_RIGHT_URL = "https://raft-blast-61784561.figma.site/_assets/v11/392db6a6a6b98e868bd7f8d3f55bb719d51e5028.png"
const BRIDGE_URL = "https://raft-blast-61784561.figma.site/_assets/v11/c6a6d8ef49bca43f708aa852692942c45ec950d4.png"
const FRAME_TWO_URL = "https://raft-blast-61784561.figma.site/_assets/v11/ba75252bab2b1c510987b74837770f7bc8a6b2d4.png"

const ICON_1 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png"
const ICON_2 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png"
const ICON_3 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png"

const sightCards = [
  {
    id: "software-engineering",
    kicker: "Featured Program",
    title: "Applied Software Engineering",
    body: "Studio-led software engineering with internship exposure and a capstone delivery track.",
    pin: ICON_1,
  },
  {
    id: "data-science",
    kicker: "Adjacent Path",
    title: "Data Science & AI",
    body: "Data systems, machine learning operations, and responsible applied AI.",
    pin: ICON_2,
  },
  {
    id: "cybersecurity",
    kicker: "Adjacent Path",
    title: "Cybersecurity Engineering",
    body: "Secure systems, cloud defense, and resilient product architecture.",
    pin: ICON_3,
  },
  {
    id: "studio-internship",
    kicker: "Delivery Mode",
    title: "Studio + Internship",
    body: "Hands-on delivery from year one, linked to real internship placements.",
    pin: ICON_1,
  },
  {
    id: "capstone",
    kicker: "Final Year",
    title: "Capstone Product Lab",
    body: "Final-year work that connects directly to internship and capstone outcomes.",
    pin: ICON_2,
  },
]

const semesterYears = [
  {
    year: "Year 1",
    description: "Foundations in computing, quantitative reasoning, and technical communication.",
    semesters: [
      {
        name: "Semester 1",
        courses: [
          "Foundations of Computing",
          "Programming Fundamentals with Python",
          "Applied Calculus I",
          "Technical Communication",
        ],
      },
      {
        name: "Semester 2",
        courses: [
          "Object-Oriented Programming with Java",
          "Data & Algorithms I",
          "Applied Calculus II",
          "Ethics & Responsible Technology",
        ],
      },
    ],
  },
  {
    year: "Year 2",
    description: "Core engineering systems, architecture, web delivery, and studio practice.",
    semesters: [
      {
        name: "Semester 3",
        courses: [
          "Software Design Patterns & Refactoring",
          "Data Modeling & SQL Systems",
          "Systems Architecture",
          "Agile Project Studio I",
        ],
      },
      {
        name: "Semester 4",
        courses: [
          "Web Engineering & APIs",
          "Mobile Engineering Studio",
          "DevOps Foundations",
          "Tech Policy, Law, and Regulation",
        ],
      },
    ],
  },
  {
    year: "Year 3",
    description: "Advanced systems, secure practice, internship immersion, and capstone execution.",
    semesters: [
      {
        name: "Semester 5",
        courses: [
          "Cloud-Native Systems",
          "Secure Software Practice",
          "Networks & Distributed Communication",
          "Agile Project Studio II",
        ],
      },
      {
        name: "Semester 6",
        courses: [
          "AI Engineering Fundamentals",
          "Distributed Systems & Streaming",
          "Industry Immersion Internship",
          "Capstone Product Lab",
        ],
      },
    ],
  },
]

const applicationPrograms = [
  "BSc Applied Software Engineering",
  "BSc Data Science & AI",
  "BSc Cybersecurity Engineering",
  "BBA Technology Management",
]

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useCinemaScroll(rootRef)

  const [program, setProgram] = useState(applicationPrograms[0])
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", note: "" })
  const [status, setStatus] = useState<{ success?: string; error?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const submitApplication = useCallback(async () => {
    const emailValid = /^\S+@\S+\.\S+$/.test(form.email.trim())
    if (!form.fullName.trim() || !form.email.trim() || !program.trim()) {
      setStatus({ error: "Please add your name, email, and program of interest." })
      return
    }
    if (!emailValid) {
      setStatus({ error: "Please enter a valid email address." })
      return
    }
    setSubmitting(true)
    setStatus({})
    try {
      await createFeedback({
        subject: `Application interest: ${program}`,
        comment: [
          `Name: ${form.fullName}`,
          `Email: ${form.email}`,
          form.phone ? `Phone: ${form.phone}` : null,
          `Program: ${program}`,
          "Level: Bachelor",
          form.note ? `Notes: ${form.note}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        category: "admissions",
        type: "general",
        priority: "high",
        targetRole: "admin",
        source: "public-admissions",
      })
      setStatus({ success: "Your application interest has been submitted successfully." })
      setForm({ fullName: "", email: "", phone: "", note: "" })
      setProgram(applicationPrograms[0])
    } catch (error) {
      setStatus({ error: error instanceof Error ? error.message : "Unable to submit application" })
    } finally {
      setSubmitting(false)
    }
  }, [form, program])

  return (
    <div ref={rootRef} className="cinema-root">
      <main className="site-shell">
        <section className="cinema-scroll" id="cinema" aria-label="UNYX cinematic scroll story">
          <div className="stage">
            <div className="world">
              <img className="scene-img sky-img" src={SKY_URL} alt="" />

              <header className="site-header" aria-label="Primary navigation">
                <Link href="#cinema" className="site-logo">
                  UNYX
                </Link>
                <nav className="site-nav" aria-label="Main menu">
                  <Link href="#cinema">Intro</Link>
                  <Link href="#bridge">Future</Link>
                  <Link href="#bazaar">Campus</Link>
                  <Link href="#routes">Programs</Link>
                </nav>
                <Button type="button" variant="ghost" className="language-switcher h-auto p-0" aria-label="Change language">
                  <span>EN</span>
                  <span aria-hidden="true">⌄</span>
                </Button>
              </header>

              <div className="back-stack">
                <img className="scene-img back-img back-four" src={BACK_FOUR_URL} alt="" />

                <section className="sights-slider" aria-label="UNYX programs slider">
                  <div className="sights-track">
                    {sightCards.map((card, i) => (
                      <article
                        key={card.id}
                        className="sight-card"
                        tabIndex={0}
                        role="button"
                        aria-label={`Open ${card.title} card`}
                        data-sight-index={i}
                      >
                        <span className="sight-kicker">{card.kicker}</span>
                        <img className="sight-pin" src={card.pin} alt="" />
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <img className="scene-img back-img back-bazaar" src={BAZAAR_URL} alt="" />
              </div>

              <div className="sights-controls" aria-label="Slider controls">
                <button type="button" className="sight-nav sight-prev" aria-label="Previous program">
                  ←
                </button>
                <button type="button" className="sight-nav sight-next" aria-label="Next program">
                  →
                </button>
              </div>

              <h1 className="hero-title notranslate" translate="no">UNYX</h1>

              <img className="scene-img splitframe-img splitframe-left" src={SPLIT_LEFT_URL} alt="" />
              <img className="scene-img splitframe-img splitframe-right" src={SPLIT_RIGHT_URL} alt="" />
              <img className="scene-img bridge-img" src={BRIDGE_URL} alt="" />
              <img className="scene-img frame-two-img" src={FRAME_TWO_URL} alt="" />

              <div className="shade" />
            </div>

            <section className="intro-copy" aria-label="UNYX overview">
              <p>
                Academic rigor with startup-style execution — a place built for students who want to
                think critically, build confidently, and lead modern organizations.
              </p>
              <div className="hero-tags" aria-label="UNYX highlights">
                <div className="hero-tags-row">
                  <span>Applied Software Engineering</span>
                  <span>Data Science &amp; AI</span>
                </div>
                <div className="hero-tags-row">
                  <Link href="/login">Login</Link>
                </div>
              </div>
            </section>

            <section className="story-panel story-panel-bridge" aria-label="Bridge to your future">
              <h2>The bridge to your future starts here.</h2>
              <p>
                UNYX links ambition to outcome, anchoring every program in studio practice, industry
                exposure, and a curriculum shaped by real product delivery.
              </p>
              <dl className="facts">
                <div>
                  <dt>180</dt>
                  <dd>ECTS across a 3-year applied path</dd>
                </div>
                <div>
                  <dt>46+</dt>
                  <dd>Applied modules from foundations to capstone</dd>
                </div>
              </dl>
            </section>

            <section className="story-panel story-panel-bazaar" aria-label="Campus and community details">
              <h2>A campus that keeps you close to your craft.</h2>
              <p>
                Studio space, mentorship, and a compact community mean students stay a short walk from
                faculty, peers, and the tools they're building with.
              </p>
              <button type="button" className="note-button">
                <span aria-hidden="true">↗</span>
                <span>Open program notes</span>
              </button>
            </section>
          </div>
        </section>
      </main>

      <div className="cinema-below">
        <section id="curriculum" className="px-4 py-14 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.76fr_1.24fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#59708b]">Semester Plan</p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#003366] md:text-4xl">
                A clean progression from fundamentals to capstone delivery
              </h2>
              <p className="text-base leading-8 text-[#556c86]">
                The curriculum is organized across Year 1 to Year 3, with each year balancing theory,
                technical execution, and applied studio learning.
              </p>
              <div className="rounded-[24px] border border-[#dce7fb] bg-white/85 p-5 shadow-[0_18px_42px_-32px_rgba(0,51,102,0.2)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#617792]">Program rhythm</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="h-4 w-4 text-[#003366]" />
                    <p className="text-sm text-[#556c86]">Studio projects appear early, not only at the end.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-[#003366]" />
                    <p className="text-sm text-[#556c86]">Foundations are paired with product-facing delivery skills.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-4 w-4 text-[#003366]" />
                    <p className="text-sm text-[#556c86]">Final-year work connects directly to internship and capstone outcomes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dce7fb] bg-white/90 p-4 md:p-6 shadow-[0_28px_70px_-44px_rgba(0,51,102,0.28)]">
              <Accordion type="single" collapsible defaultValue="Year 1" className="space-y-4">
                {semesterYears.map((yearBlock) => (
                  <AccordionItem
                    key={yearBlock.year}
                    value={yearBlock.year}
                    className="overflow-hidden rounded-[24px] border border-[#dce7fb] bg-[linear-gradient(180deg,#f9fbff,#f4f8ff)] px-5"
                  >
                    <AccordionTrigger className="py-5 text-left hover:no-underline">
                      <div>
                        <p className="text-lg font-semibold text-[#003366]">{yearBlock.year}</p>
                        <p className="mt-1 text-sm font-normal leading-7 text-[#5b7089]">{yearBlock.description}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        {yearBlock.semesters.map((semester) => (
                          <motion.div
                            key={semester.name}
                            whileHover={{ y: -4 }}
                            className="rounded-[22px] border border-[#dce7fb] bg-white p-4"
                          >
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#617792]">{semester.name}</p>
                            <div className="mt-4 space-y-3">
                              {semester.courses.map((course) => (
                                <div
                                  key={`${semester.name}-${course}`}
                                  className="rounded-[18px] border border-[#e6eeff] bg-[#f8fbff] px-4 py-3 text-sm text-[#556c86]"
                                >
                                  {course}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section id="apply" className="px-4 py-14 pb-20 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#59708b]">Continue to Apply</p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#003366] md:text-4xl">
                Start your UNYX application in a clean, focused flow
              </h2>
              <p className="text-base leading-8 text-[#556c86]">
                Share your contact details and intended program. The request is routed into the
                admissions workflow without requiring a portal login.
              </p>
              <div className="rounded-[24px] bg-[#003366] p-5 text-white shadow-[0_28px_70px_-42px_rgba(0,51,102,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Admissions note</p>
                <p className="mt-3 text-lg leading-8">
                  The featured path is preselected to keep the flow fast, but you can switch programs
                  before submitting.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dce7fb] bg-white/92 p-6 shadow-[0_32px_80px_-48px_rgba(0,51,102,0.32)] backdrop-blur md:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#003366]">Full name</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className="h-12 rounded-[18px] border-[#d3e2ff] bg-[#f9fbff] transition-all focus-visible:border-[#1563c5] focus-visible:ring-[#1563c5]/25"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#003366]">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="h-12 rounded-[18px] border-[#d3e2ff] bg-[#f9fbff] transition-all focus-visible:border-[#1563c5] focus-visible:ring-[#1563c5]/25"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#003366]">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+355 ..."
                    className="h-12 rounded-[18px] border-[#d3e2ff] bg-[#f9fbff] transition-all focus-visible:border-[#1563c5] focus-visible:ring-[#1563c5]/25"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#003366]">Program</label>
                  <Select value={program} onValueChange={setProgram}>
                    <SelectTrigger className="h-12 rounded-[18px] border-[#d3e2ff] bg-[#f9fbff]">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationPrograms.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-[#003366]">Notes</label>
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Tell admissions what you're interested in, when you want to start, or any questions you have."
                    rows={5}
                    className="rounded-[20px] border-[#d3e2ff] bg-[#f9fbff] transition-all focus-visible:border-[#1563c5] focus-visible:ring-[#1563c5]/25"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="h-12 rounded-[18px] bg-[#003366] px-6 text-white hover:bg-[#0a427b]"
                  onClick={submitApplication}
                  disabled={submitting}
                >
                  {submitting ? <Spinner className="h-4 w-4" /> : "Continue to Apply"}
                </Button>
                <div className="text-sm">
                  {status.error && <span className="text-red-600">{status.error}</span>}
                  {status.success && <span className="text-emerald-600">{status.success}</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
