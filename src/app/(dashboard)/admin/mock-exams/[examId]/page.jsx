// this tells nextjs to run this page in the browser
"use client"

// helper tool from react to unwrap parameters from the url
import { use } from "react"

// the main quiz and question builder component
import QuizBuilder from "@/components/quiz-builder"

// loads the quiz builder screen for a specific mock exam id
export default function MockExamBuilderPage({ params }) {
    // get the exam id from the url
    const { examId } = use(params)

    // display the quiz builder component
    return (
        <div className="w-full min-h-full">
            <QuizBuilder examId={examId} />
        </div>
    )
}
