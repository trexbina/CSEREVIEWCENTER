// this tells nextjs to run this page in the browser
"use client"

// helper tool from react to unwrap parameters from the url
import { use } from "react"

// the main mock exam builder component
import MockExamBuilder from "@/components/mock-exam-builder"

// loads the mock exam builder screen for a specific mock exam id
export default function MockExamBuilderPage({ params }) {
    // get the exam id from the url
    const { examId } = use(params)

    // display the mock exam builder component
    return (
        <div className="w-full min-h-full">
            <MockExamBuilder key={examId} examId={examId} />
        </div>
    )
}

