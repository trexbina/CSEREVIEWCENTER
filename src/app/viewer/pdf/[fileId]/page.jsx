"use client"

import { use } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { SecurityShield } from "@/components/security-shield"

const CustomPdfViewer = dynamic(() => import("@/components/custom-pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-500 text-sm font-medium">Loading document...</p>
        </div>
    )
})

export default function DocumentViewerPage({ params }) {
    const { fileId } = use(params)
    const pdfUrl = `/api/files/${fileId}`

    return (
        <SecurityShield blurOnFocusLoss={true}>
            <div className="w-full h-screen flex flex-col bg-background select-none">
                <div className="flex-1 w-full h-full relative overflow-hidden">
                    <CustomPdfViewer url={pdfUrl} isStudent={true} />
                </div>
            </div>
        </SecurityShield>
    )
}
