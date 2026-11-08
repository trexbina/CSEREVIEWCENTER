import { ExamLandingPage } from "@/components/exam-landing-page"
import { EXAM_LANDING_PAGES } from "@/components/exam-landing-data"

export const metadata = { title: EXAM_LANDING_PAGES.pnle.title, description: EXAM_LANDING_PAGES.pnle.description }
export default function PNLEPage() { return <ExamLandingPage exam="pnle" /> }
