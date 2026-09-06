export function extractSubjectFiles(modules) {
    const files = []
    const seenUrls = new Set()

    if (!Array.isArray(modules)) return files

    modules.forEach((mod) => {
        const modTitle = mod.title || "Module"
        const lessons = Array.isArray(mod.lessons) ? mod.lessons : []

        lessons.forEach((lesson) => {
            const lessonTitle = lesson.title || "Lesson"
            const sourceLabel = `${modTitle} • ${lessonTitle}`

            // 1. PDF files attached directly to lesson
            let rawPdfFiles = lesson.pdf_files
            if (typeof rawPdfFiles === "string") {
                try { rawPdfFiles = JSON.parse(rawPdfFiles) } catch { rawPdfFiles = [] }
            }
            if (Array.isArray(rawPdfFiles)) {
                rawPdfFiles.forEach((pdf, idx) => {
                    if (pdf && pdf.url && !seenUrls.has(pdf.url)) {
                        seenUrls.add(pdf.url)
                        files.push({
                            id: `pdf-${lesson.id}-${idx}`,
                            url: pdf.url,
                            name: pdf.name || extractFilename(pdf.url) || `Document ${idx + 1}.pdf`,
                            type: "pdf",
                            source: sourceLabel,
                            lessonId: lesson.id,
                        })
                    }
                })
            }

            // 2. Parse quiz_content (either module blocks or quiz)
            let quizContent = lesson.quiz_content
            if (typeof quizContent === "string") {
                try { quizContent = JSON.parse(quizContent) } catch { quizContent = null }
            }

            if (quizContent) {
                // If module blocks (array)
                if (Array.isArray(quizContent)) {
                    function scanBlocks(blocks) {
                        if (!Array.isArray(blocks)) return
                        blocks.forEach((block, bIdx) => {
                            if (!block) return
                            const blockType = String(block.type || "").toLowerCase()
                            const blockUrl = block.content || block.url || block.src

                            if (typeof blockUrl === "string" && blockUrl.trim() && !seenUrls.has(blockUrl)) {
                                const detectedType = detectFileType(blockUrl, blockType)
                                if (detectedType) {
                                    seenUrls.add(blockUrl)
                                    files.push({
                                        id: `block-${lesson.id}-${block.id || bIdx}`,
                                        url: blockUrl,
                                        name: block.name || block.title || block.caption || extractFilename(blockUrl),
                                        type: detectedType,
                                        source: sourceLabel,
                                        lessonId: lesson.id,
                                    })
                                }
                            }
                            if (Array.isArray(block.children)) {
                                scanBlocks(block.children)
                            }
                        })
                    }
                    scanBlocks(quizContent)
                }
                // If quiz object { questions, settings }
                else if (typeof quizContent === "object") {
                    const settings = quizContent.settings || {}
                    const refPdfs = Array.isArray(settings.referencePdfs)
                        ? settings.referencePdfs
                        : (settings.referencePdf?.url ? [settings.referencePdf] : [])

                    refPdfs.forEach((pdf, idx) => {
                        if (pdf && pdf.url && !seenUrls.has(pdf.url)) {
                            seenUrls.add(pdf.url)
                            files.push({
                                id: `quiz-ref-${lesson.id}-${idx}`,
                                url: pdf.url,
                                name: pdf.name || extractFilename(pdf.url) || `Reference ${idx + 1}.pdf`,
                                type: "pdf",
                                source: `${sourceLabel} (Reference)`,
                                lessonId: lesson.id,
                            })
                        }
                    })

                    // Images or videos in questions
                    const questions = Array.isArray(quizContent.questions) ? quizContent.questions : []
                    questions.forEach((q, qIdx) => {
                        const imgUrl = typeof q?.image === "string" ? q.image : q?.image?.url
                        if (imgUrl && !seenUrls.has(imgUrl)) {
                            seenUrls.add(imgUrl)
                            const qLabel = q.type === "title_description" ? "Title Card" : `Question ${qIdx + 1}`
                            files.push({
                                id: `q-img-${lesson.id}-${q.id || qIdx}`,
                                url: imgUrl,
                                name: extractFilename(imgUrl) || `${qLabel} Image`,
                                type: "image",
                                source: `${sourceLabel} (${qLabel})`,
                                lessonId: lesson.id,
                            })
                        }

                        const vidUrl = typeof q?.video === "string" ? q.video : q?.video?.url
                        if (vidUrl && !seenUrls.has(vidUrl)) {
                            seenUrls.add(vidUrl)
                            const qLabel = q.type === "title_description" ? "Title Card" : `Question ${qIdx + 1}`
                            files.push({
                                id: `q-vid-${lesson.id}-${q.id || qIdx}`,
                                url: vidUrl,
                                name: extractFilename(vidUrl) || `${qLabel} Video`,
                                type: "video",
                                source: `${sourceLabel} (${qLabel})`,
                                lessonId: lesson.id,
                            })
                        }
                    })
                }
            }
        })
    })

    return files
}

export function extractFilename(url) {
    if (!url || typeof url !== "string") return "File"
    try {
        const clean = url.split("?")[0].split("#")[0]
        const parts = clean.split("/")
        const last = parts[parts.length - 1]
        return decodeURIComponent(last) || "File"
    } catch {
        return "File"
    }
}

export function detectFileType(url = "", blockType = "") {
    const lowerUrl = String(url || "").toLowerCase()
    const lowerType = String(blockType || "").toLowerCase()

    if (lowerType === "image" || /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/i.test(lowerUrl)) {
        return "image"
    }
    if (lowerType === "video" || /\.(mp4|webm|ogg|mov|mkv)$/i.test(lowerUrl)) {
        return "video"
    }
    if (lowerType === "pdf" || /\.pdf$/i.test(lowerUrl)) {
        return "pdf"
    }
    if (lowerType === "audio" || /\.(mp3|wav|ogg|m4a|aac)$/i.test(lowerUrl)) {
        return "audio"
    }
    // If it's an uploaded file from /api/files, check patterns
    if (lowerUrl.includes("/image") || lowerUrl.includes("image")) return "image"
    if (lowerUrl.includes("/video") || lowerUrl.includes("video")) return "video"
    if (lowerUrl.includes("/pdf") || lowerUrl.includes("pdf")) return "pdf"
    return lowerType || "file"
}
