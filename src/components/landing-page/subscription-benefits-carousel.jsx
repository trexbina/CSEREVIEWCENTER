"use client"

import { MotionCarousel } from "@/components/animate-ui/components/community/motion-carousel"

const BENEFIT_SLIDES = [
  {
    id: "modules",
    title: "All review modules",
    description: "Study every Civil Service Examination topic with complete access to organized lessons and review materials.",
    image: "/landingpageassets/figma/design-37948.png",
  },
  {
    id: "mock-tests",
    title: "Daily mock test updates",
    description: "Practice with fresh, timed mock tests that help you build accuracy, speed, and exam-day confidence.",
    image: "/landingpageassets/figma/design-0ee45.png",
  },
  {
    id: "quizzes",
    title: "Daily quiz updates",
    description: "Keep your momentum with new quizzes designed to reinforce lessons and reveal what to review next.",
    image: "/landingpageassets/figma/design-b5be4.png",
  },
  {
    id: "progression",
    title: "Full progression insights",
    description: "See your scores, strengths, improvement areas, and learning progress in one clear dashboard.",
    image: "/landingpageassets/figma/design-7b83f.png",
  },
  {
    id: "resources",
    title: "Practice materials and learning resources",
    description: "Use practical resources, examples, and guided materials to make every review session count.",
    image: "/landingpageassets/figma/design-4a1bf.png",
  },
]

export function SubscriptionBenefitsCarousel() {
  return (
    <section className="bg-[#fffaf5] px-6 py-14 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[980px] rounded-[28px] bg-white p-5 shadow-[0_10px_45px_rgba(38,45,118,.08)] sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f48c06]">Every plan includes</p>
          <h2 className="mt-2 text-2xl font-bold text-[#2f327d] sm:text-3xl">Tools that keep your review moving.</h2>
        </div>
        <MotionCarousel
          slides={BENEFIT_SLIDES}
          options={{ loop: true, align: "center" }}
          renderSlide={(slide) => (
            <div className="relative flex size-full flex-col overflow-hidden rounded-xl border border-[#cbd3df] bg-[#fffaf5]">
              <img src={slide.image} alt="" className="h-32 w-full object-cover sm:h-44" />
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                <h3 className="text-base font-bold leading-tight text-[#2f327d] sm:text-lg">{slide.title}</h3>
                <p className="text-xs leading-5 text-[#696984] sm:text-sm">{slide.description}</p>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  )
}
