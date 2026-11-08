import { ExamLandingPage } from "@/components/exam-landing-page"
import { EXAM_LANDING_PAGES } from "@/components/exam-landing-data"

export const metadata = { title: EXAM_LANDING_PAGES.cse.title, description: EXAM_LANDING_PAGES.cse.description }
export default function CSEPage() { return <ExamLandingPage exam="cse" /> }
