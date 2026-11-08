import { ExamLandingPage } from "@/components/exam-landing-page"
import { EXAM_LANDING_PAGES } from "@/components/exam-landing-data"

export const metadata = { title: EXAM_LANDING_PAGES.nclex.title, description: EXAM_LANDING_PAGES.nclex.description }
export default function NCLEXPage() { return <ExamLandingPage exam="nclex" /> }
