"use client"

import { BarChart3, BookOpen, CheckCircle2, ClipboardList, Users } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { SubscriptionBenefitsCarousel } from "@/components/landing-page/subscription-benefits-carousel"

const tools = [
  ["Organized review content", "Keep subjects, lessons, PDFs, and practice material structured for each program.", ClipboardList],
  ["Practice that feels like exam day", "Build timed quizzes and mock exams, then make results easy to review.", BookOpen],
  ["Progress your team can see", "Give learners, instructors, and staff a clearer view of readiness and next steps.", Users],
]

const featureRows = [
  ["A user interface designed for the classroom", "Teachers can easily see all students and class data at one time.", "design-7b83f.png"],
  ["Tools for teachers and learners", "Classroom management tools help every student and instructor stay focused.", "design-b0797.png"],
  ["Assessments, quizzes, tests", "Easily build assessments, monitor results, and provide feedback in one place.", "design-0ee45.png"],
  ["One-on-one discussions", "Keep learners connected with clear communication and timely support.", "design-b5be4.png"],
]

export function AboutSystemSection() {
  return (
    <>
      <section className="bg-white px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1200px] text-center">
          <p className="text-sm text-[#696984]">A shared platform for different review programs</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-[#2f327d]">
            {[['NCLEX', '/nclex'], ['PNLE', '/pnle'], ['BLEPT', '/blept'], ['CSE', '/cse']].map(([program, href]) => <a key={program} href={href} className="rounded-full bg-[#fff2e2] px-4 py-2 transition-colors hover:bg-[#fce4c8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-2">{program}</a>)}
            <span className="rounded-full bg-[#fff2e2] px-4 py-2">More programs</span>
          </div>
        </div>
      </section>

      <SubscriptionBenefitsCarousel />

      <section className="bg-white px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-bold text-[#2f327d] sm:text-4xl">All-in-one <span className="text-[#f48c06]">review software.</span></h2><p className="mt-5 text-sm leading-7 text-[#696984] sm:text-base">CSE Review System combines the tools needed to run focused review programs and help examinees prepare with confidence.</p></div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {tools.map(([title, description, Icon]) => <article key={title} className="rounded-[20px] bg-white px-8 py-16 text-center shadow-[0_10px_60px_rgba(38,45,118,.08)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#545ae8] text-white shadow-lg"><Icon className="h-6 w-6" /></div><h3 className="mt-8 text-lg font-semibold text-[#2f327d]">{title}</h3><p className="mt-6 text-sm leading-7 text-[#696984]">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1000px] text-center"><h2 className="text-3xl font-bold text-[#2f327d]">One platform, <span className="text-[#f48c06]">a clear plan.</span></h2><p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#696984]">Reviewees can access lessons, practice exams, progress analytics, and support in one place—whether they are preparing for the Civil Service Examination or another board-review track.</p></div>
        <div className="mx-auto mt-10 grid max-w-[900px] gap-7 sm:grid-cols-2">
          <a href="/register" className="group relative overflow-hidden rounded-[20px]"><img src="/landingpageassets/figma/design-4a1bf.png" alt="Review lessons" className="h-56 w-full object-cover transition-transform group-hover:scale-105" /><div className="absolute inset-0 flex flex-col items-center justify-center bg-[#171b41]/40 text-white"><strong className="text-lg">FOR REVIEWERS</strong><span className="mt-3 rounded-full border border-white px-5 py-2 text-xs">Register for a review track</span></div></a>
          <LoginDialog><button type="button" className="group relative overflow-hidden rounded-[20px] text-left"><img src="/landingpageassets/figma/design-37948.png" alt="Students in a classroom" className="h-56 w-full object-cover transition-transform group-hover:scale-105" /><span className="absolute inset-0 flex flex-col items-center justify-center bg-[#171b41]/40 text-white"><strong className="text-lg">FOR STUDENTS</strong><span className="mt-3 rounded-full bg-[#49c8f0] px-5 py-2 text-xs">Access student portal</span></span></button></LoginDialog>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2"><div><h2 className="text-2xl font-bold leading-tight text-[#2f327d] sm:text-3xl">Everything your review program needs, <span className="text-[#f48c06]">in one focused system.</span></h2><p className="mt-5 text-sm leading-7 text-[#696984]">Keep review materials, assessment schedules, learner progress, and program operations connected in one secure place.</p><a href="#features" className="mt-6 inline-block text-sm text-[#696984] underline underline-offset-4 transition-colors hover:text-[#2f327d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Explore features</a></div><div className="relative"><img src="/landingpageassets/figma/design-37948.png" alt="Modern classroom" className="rounded-[20px] shadow-xl" /></div></div>
      </section>

      <section id="features" className="bg-white px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]"><div className="text-center"><h2 className="text-3xl font-bold text-[#2f327d]">Our <span className="text-[#f48c06]">Features</span></h2><p className="mt-4 text-sm text-[#696984]">Everything needed to make learning activities more efficient.</p></div><div className="mt-16 space-y-24">{featureRows.map(([title, description, image], index) => <article key={title} className={`grid items-center gap-12 lg:grid-cols-2 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}><div className="overflow-hidden rounded-[20px]"><img src={`/landingpageassets/figma/${image}`} alt="" className="max-h-[360px] w-full object-cover" /></div><div><h3 className="text-2xl font-bold leading-tight text-[#2f327d] sm:text-3xl">{title}</h3><p className="mt-5 text-sm leading-7 text-[#696984]">{description}</p><div className="mt-7 flex items-center gap-3 text-sm text-[#696984]"><CheckCircle2 className="h-5 w-5 text-[#49c8f0]" /> Designed for confident progress</div></div></article>)}</div></div>
      </section>

      <section className="bg-[#fdfdff] px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1000px] text-center"><h2 className="text-3xl font-bold text-[#2f327d]">Designed to grow with <span className="text-[#f48c06]">your programs.</span></h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#696984]">Use a consistent workflow for new exam tracks while keeping the program structure, content, assessments, and learner access distinct.</p></div></section>

      <section className="bg-white px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1200px]"><div className="text-center"><h2 className="text-3xl font-bold text-[#2f327d]">Latest News and Resources</h2><p className="mt-4 text-sm text-[#696984]">See the developments and resources that help you prepare better.</p></div><div className="mt-12 grid gap-7 md:grid-cols-3">{[["design-37948.png", "Build a better daily review habit"], ["design-4a1bf.png", "How to prepare for exam day"], ["design-0ee45.png", "Track your progress with practice"]].map(([image, title]) => <article key={title}><img src={`/landingpageassets/figma/${image}`} alt="" className="h-48 w-full rounded-[20px] object-cover" /><h3 className="mt-5 text-lg font-semibold text-[#252641]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#696984]">Helpful ideas and practical guidance for every learner.</p></article>)}</div></div></section>
    </>
  )
}
