import { ExamLandingPage } from "@/components/exam-landing-page"
import { EXAM_LANDING_PAGES } from "@/components/exam-landing-data"

export const metadata = { title: EXAM_LANDING_PAGES.blept.title, description: EXAM_LANDING_PAGES.blept.description }
export default function BLEPTPage() { return <ExamLandingPage exam="blept" /> }
