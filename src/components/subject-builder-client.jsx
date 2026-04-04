"use client"

import { useSearchParams } from "next/navigation"
import { useRef, useState, useEffect, useMemo } from "react"
import {
    Search, Bell, PenTool, FileText, Upload, X, Loader2,
    Type, Image as ImageIcon, Minus, Quote, Play,
    Heading1, List, ListOrdered,
    Square, LayoutDashboard, Columns, Grid2X2,
    Video, Headphones, GalleryHorizontal, LayoutGrid,
    MousePointerClick, TextCursorInput, TextSelect, CheckSquare,
    Space, HelpCircle, ListTree, Code, Settings,
    ChevronDown, ChevronRight, AlignLeft, AlignCenter, AlignRight,
    Palette, Layers, ChevronLeft, Trash2, Plus, Maximize, BookOpen
} from "lucide-react"
import dynamic from "next/dynamic"

const CustomPdfViewer = dynamic(() => import("@/components/custom-pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-gray-500 text-sm font-medium">
            Loading PDF...
        </div>
    )
})

const BLOCK_CATEGORIES = [
    {
        id: "text",
        label: "Text",
        items: [
            { type: "headline", label: "Headline", icon: Heading1 },
            { type: "text", label: "Text", icon: Type },
            { type: "bullet_list", label: "Bulleted List", icon: List },
            { type: "numbered_list", label: "Numbered List", icon: ListOrdered },
            { type: "quote", label: "Quote", icon: Quote },
        ]
    },
    {
        id: "layout",
        label: "Layout",
        items: [
            { type: "section", label: "Section", icon: Square },
            { type: "row", label: "Row", icon: LayoutDashboard },
            { type: "2_col", label: "2 Col", icon: Columns },
            { type: "3_col", label: "3 Col", icon: Grid2X2 },
            { type: "4_col", label: "4 Col", icon: LayoutGrid },
        ]
    },
    {
        id: "media",
        label: "Media",
        items: [
            { type: "image", label: "Image", icon: ImageIcon },
            { type: "video", label: "Video", icon: Video },
            { type: "audio", label: "Audio", icon: Headphones },
            { type: "carousel", label: "Carousel", icon: GalleryHorizontal },
            { type: "gallery", label: "Gallery", icon: LayoutGrid },
        ]
    },
    {
        id: "forms",
        label: "Forms",
        items: [
            { type: "button", label: "Button", icon: MousePointerClick },
            { type: "input", label: "Input", icon: TextCursorInput },
            { type: "textarea", label: "Textarea", icon: TextSelect },
            { type: "checkbox", label: "Checkbox", icon: CheckSquare },
        ]
    },
    {
        id: "other",
        label: "Other",
        items: [
            { type: "divider", label: "Divider", icon: Minus },
            { type: "spacer", label: "Spacer", icon: Space },
            { type: "faq", label: "FAQ", icon: HelpCircle },
            { type: "toc", label: "Table of Contents", icon: ListTree },
            { type: "html", label: "Raw HTML", icon: Code },
        ]
    }
];
export default function SubjectBuilderClient({ subject, isStudent = false, currentUserName = "" }) {
    const searchParams = useSearchParams()
    const lessonId = searchParams.get("lessonId")
    const lessonType = searchParams.get("type") // "module" or "pdf"

    // PDF builder state
    const [pdfFiles, setPdfFiles] = useState([]) // array of { name, url, file }
    const [uploading, setUploading] = useState(false)
    const [activePdf, setActivePdf] = useState(null) // currently previewed PDF url
    const fileInputRef = useRef(null)

    // Module builder state
    const [blocks, setBlocks] = useState([])
    const [saving, setSaving] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [activeToolCategory, setActiveToolCategory] = useState("text")
    const [activeBlockId, setActiveBlockId] = useState(null)
    const [viewMode, setViewMode] = useState(isStudent ? "student" : "admin")
    const [uploadingBlockId, setUploadingBlockId] = useState(null)
    const [fullscreenImage, setFullscreenImage] = useState(null)

    const activeBlock = useMemo(() => {
        if (!activeBlockId) return null;
        let found = null;
        function findBlock(items) {
            for (let item of items) {
                if (item.id === activeBlockId) { found = item; return true; }
                if (item.children && findBlock(item.children)) return true;
            }
            return false;
        }
        findBlock(blocks);
        return found;
    }, [activeBlockId, blocks]);

    // Clear the canvas whenever the user switches lessons
    useEffect(() => {
        setBlocks([])
        setPdfFiles([])
        setActivePdf(null)
        setUploading(false)

        if (!lessonId) return

        async function fetchLessonData() {
            setFetching(true)
            try {
                const endpoint = isStudent
                    ? `/api/student/subjects/${subject.id}/lessons/${lessonId}`
                    : `/api/admin/subjects/${subject.id}/lessons/${lessonId}`;

                const res = await fetch(endpoint)
                if (res.ok) {
                    const { lesson } = await res.json()
                    if (lessonType === "pdf" && lesson.pdf_files?.length > 0) {
                        setPdfFiles(lesson.pdf_files)
                        setActivePdf(lesson.pdf_files[0].url)
                    } else if (lessonType === "module" && lesson.quiz_content) {
                        try {
                            setBlocks(JSON.parse(lesson.quiz_content))
                        } catch (e) {
                            console.error("Failed to parse blocks")
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch lesson error:", err)
            } finally {
                setFetching(false)
            }
        }

        fetchLessonData()
    }, [lessonId, lessonType, subject.id])

    async function readUploadError(response) {
        try {
            const data = await response.json()
            if (data?.error) return data.error
        } catch (err) {
            // Ignore parse errors and fall back to status text.
        }
        return `Upload failed (${response.status})`
    }

    async function handlePdfUpload(e) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", files[0])

            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })
            if (!uploadRes.ok) {
                const message = await readUploadError(uploadRes)
                throw new Error(message)
            }
            const uploadData = await uploadRes.json()

            const newFile = {
                name: uploadData.name,
                url: uploadData.url
            }

            setPdfFiles([newFile])
            setActivePdf(newFile.url)

            // Auto-save to database
            await fetch(`/api/admin/subjects/${subject.id}/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdf_files: [newFile] })
            })
            console.log("PDF Auto-saved!")
        } catch (err) {
            console.error(err)
            alert(err?.message || "Failed to upload PDF")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    function removePdf(url) {
        setPdfFiles(prev => prev.filter(f => f.url !== url))
        if (activePdf === url) {
            const remaining = pdfFiles.filter(f => f.url !== url)
            setActivePdf(remaining[0]?.url || null)
        }
    }

    async function handleMediaUpload(e, blockId) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploadingBlockId(blockId);
        try {
            const formData = new FormData();
            formData.append("file", files[0]);

            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) {
                const message = await readUploadError(uploadRes)
                throw new Error(message)
            }
            const uploadData = await uploadRes.json();

            updateBlockContent(blockId, uploadData.url);
        } catch (err) {
            console.error(err);
            alert(err?.message || "Failed to upload media");
        } finally {
            setUploadingBlockId(null);
        }
    }

    // Module Builder Handlers
    function handleDragStart(e, type) {
        e.dataTransfer.setData("blockType", type)
        e.stopPropagation()
    }

    function createBlock(type) {
        const id = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 5);
        const newBlock = { id, type, content: "", properties: {} };

        if (["text", "headline", "quote", "bullet_list", "numbered_list"].includes(type)) {
            newBlock.properties = { fontFamily: "inherit", color: "#333333", fontSize: type === "headline" ? "24px" : "16px", textAlign: "left" };
            if (type === "headline") newBlock.content = "Heading...";
            if (type === "bullet_list" || type === "numbered_list") newBlock.content = "<li>List item</li>";
        }
        if (type === "button") {
            newBlock.properties = { backgroundColor: "#3b82f6", color: "#ffffff", borderRadius: "8px", padding: "12px 24px", textAlign: "center" };
            newBlock.content = "Click Me";
        }

        if (type === "2_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] }
            ];
        } else if (type === "3_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] },
                { id: id + "_c3", type: "column", children: [] }
            ];
        } else if (type === "4_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] },
                { id: id + "_c3", type: "column", children: [] },
                { id: id + "_c4", type: "column", children: [] }
            ];
        } else if (type === "row" || type === "section") {
            newBlock.children = [];
        }

        return newBlock;
    }

    function handleDrop(e, parentId = null) {
        e.preventDefault()
        e.stopPropagation()

        const moveBlockId = e.dataTransfer.getData("moveBlockId")
        if (moveBlockId) {
            if (moveBlockId === parentId) return; // Prevent dropping on itself

            setBlocks(prev => {
                const newBlocks = JSON.parse(JSON.stringify(prev));
                let blockToMove = null;

                // 1. Find and extract the block from its current location
                function extractBlock(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].id === moveBlockId) {
                            blockToMove = items[i];
                            items.splice(i, 1);
                            return true;
                        }
                        if (items[i].children && extractBlock(items[i].children)) return true;
                    }
                    return false;
                }
                extractBlock(newBlocks);
                if (!blockToMove) return prev;

                // 2. Insert into new location
                if (!parentId) {
                    newBlocks.push(blockToMove);
                } else {
                    function insertBlock(items) {
                        for (let item of items) {
                            if (item.id === parentId) {
                                if (!item.children) item.children = [];
                                item.children.push(blockToMove);
                                return true;
                            }
                            if (item.children && insertBlock(item.children)) return true;
                        }
                        return false;
                    }
                    insertBlock(newBlocks);
                }
                return newBlocks;
            });
            return;
        }

        const type = e.dataTransfer.getData("blockType")
        if (!type) return;

        const newBlock = createBlock(type);

        if (!parentId) {
            setBlocks(prev => [...prev, newBlock]);
        } else {
            setBlocks(prev => {
                const newBlocks = JSON.parse(JSON.stringify(prev));
                function appendToParent(items) {
                    for (let item of items) {
                        if (item.id === parentId) {
                            if (!item.children) item.children = [];
                            item.children.push(newBlock);
                            return true;
                        }
                        if (item.children && appendToParent(item.children)) return true;
                    }
                    return false;
                }
                appendToParent(newBlocks);
                return newBlocks;
            });
        }
    }

    function handleInsertBefore(e, targetId) {
        e.preventDefault()
        e.stopPropagation()

        const moveBlockId = e.dataTransfer.getData("moveBlockId")
        const newBlockType = e.dataTransfer.getData("blockType")

        if (!moveBlockId && !newBlockType) return;
        if (moveBlockId === targetId) return; // Prevent dropping on itself

        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            let blockToInsert = null;

            if (moveBlockId) {
                // Find and extract
                function extractBlock(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].id === moveBlockId) {
                            blockToInsert = items[i];
                            items.splice(i, 1);
                            return true;
                        }
                        if (items[i].children && extractBlock(items[i].children)) return true;
                    }
                    return false;
                }
                extractBlock(newBlocks);
                if (!blockToInsert) return prev;
            } else if (newBlockType) {
                blockToInsert = createBlock(newBlockType);
            }

            if (!blockToInsert) return prev;

            // Insert before targetId
            function insertBefore(items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].id === targetId) {
                        items.splice(i, 0, blockToInsert);
                        return true;
                    }
                    if (items[i].children && insertBefore(items[i].children)) return true;
                }
                return false;
            }
            insertBefore(newBlocks);

            return newBlocks;
        });
    }

    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    function removeBlock(id) {
        setBlocks(prev => {
            function filterLoop(items) {
                const filtered = items.filter(b => b.id !== id);
                return filtered.map(b => {
                    if (b.children) b.children = filterLoop(b.children);
                    return b;
                });
            }
            return filterLoop(prev);
        });
        if (activeBlockId === id) setActiveBlockId(null);
    }

    function updateBlockContent(id, content) {
        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            function update(items) {
                for (let item of items) {
                    if (item.id === id) { item.content = content; return true; }
                    if (item.children && update(item.children)) return true;
                }
                return false;
            }
            update(newBlocks);
            return newBlocks;
        });
    }

    function updateBlockProperty(id, property, value) {
        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            function update(items) {
                for (let item of items) {
                    if (item.id === id) {
                        if (!item.properties) item.properties = {};
                        item.properties[property] = value;
                        return true;
                    }
                    if (item.children && update(item.children)) return true;
                }
                return false;
            }
            update(newBlocks);
            return newBlocks;
        });
    }

    async function saveModuleBlocks() {
        if (!lessonId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/subjects/${subject.id}/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quiz_content: JSON.stringify(blocks) })
            })
            if (!res.ok) throw new Error("Save failed")
        } catch (err) {
            console.error(err)
            alert("Failed to save module content.")
        } finally {
            setSaving(false)
        }
    }

    function renderBlock(block, isRoot = true) {
        const isAdmin = viewMode === 'admin';
        const isSelected = isAdmin && activeBlockId === block.id;

        const textStyles = {
            fontFamily: block.properties?.fontFamily,
            color: block.properties?.color,
            fontSize: block.properties?.fontSize,
            textAlign: block.properties?.textAlign,
            fontWeight: block.type === 'headline' ? '800' : 'normal',
            fontStyle: block.type === 'quote' ? 'italic' : 'normal'
        };

        return (
            <div
                key={block.id}
                draggable={isAdmin}
                onDragStart={(e) => {
                    if (isAdmin) {
                        e.stopPropagation();
                        e.dataTransfer.setData("moveBlockId", block.id);
                    }
                }}
                onDrop={(e) => {
                    if (isAdmin) {
                        e.currentTarget.classList.remove("border-t-4", "border-t-blue-500", "!rounded-t-none", "translate-y-1");
                        handleInsertBefore(e, block.id);
                    }
                }}
                onDragEnter={(e) => {
                    if (isAdmin) {
                        e.currentTarget.classList.add("border-t-4", "border-t-blue-500", "!rounded-t-none", "translate-y-1");
                    }
                }}
                onDragLeave={(e) => {
                    if (isAdmin) {
                        e.currentTarget.classList.remove("border-t-4", "border-t-blue-500", "!rounded-t-none", "translate-y-1");
                    }
                }}
                onDragOver={handleDragOver}
                onClick={(e) => {
                    if (!isAdmin) return;
                    e.stopPropagation();
                    setActiveBlockId(block.id);
                }}
                className={`relative group bg-white ${isAdmin ? 'border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-move' : 'p-2'
                    } ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : (isAdmin ? 'border-gray-200' : 'border-transparent')
                    } ${isRoot ? 'mb-4' : (isAdmin ? 'mb-2 h-full' : 'h-full')}`}
                style={{
                    backgroundColor: block.properties?.backgroundColor || (isRoot ? '#ffffff' : 'transparent'),
                    padding: block.properties?.padding || (isAdmin ? '1.5rem' : '0'),
                }}
            >
                {/* TEXT & HEADERS */}
                {["text", "headline", "quote", "bullet_list", "numbered_list"].includes(block.type) && (
                    <div className={block.type === 'quote' ? "border-l-4 border-blue-500 pl-4 py-1 my-2" : ""}>
                        <div
                            contentEditable={isAdmin}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                if (isAdmin) updateBlockContent(block.id, e.currentTarget.innerHTML);
                            }}
                            className={`outline-none min-h-[1.5em] leading-relaxed empty:before:text-gray-300 ${isAdmin && block.type === 'headline' ? "empty:before:content-['Heading...']" :
                                isAdmin ? "empty:before:content-['Type_text_here...']" : ""
                                }`}
                            style={textStyles}
                            dangerouslySetInnerHTML={{ __html: block.content || "" }}
                        />
                    </div>
                )}

                {/* IMAGE */}
                {block.type === 'image' && (
                    <div className={`relative overflow-hidden ${isAdmin && !block.content ? "h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400" : ""}`}>
                        {block.content ? (
                            <div className="relative group/image max-w-full inline-block">
                                <img
                                    src={block.content}
                                    alt="Image block"
                                    className={`max-w-full rounded-md object-contain transition-opacity ${!isAdmin ? 'cursor-zoom-in hover:opacity-95' : ''}`}
                                    onClick={(e) => {
                                        if (!isAdmin) {
                                            e.stopPropagation();
                                            setFullscreenImage(block.content);
                                        }
                                    }}
                                />
                                {isAdmin && (
                                    <button
                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-md backdrop-blur opacity-0 group-hover/image:opacity-100 transition-all z-10 shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(block.content); }}
                                    >
                                        <Maximize className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : isAdmin ? (
                            <>
                                {uploadingBlockId === block.id ? (
                                    <Loader2 className="h-8 w-8 mb-2 animate-spin text-blue-500" />
                                ) : (
                                    <>
                                        <ImageIcon className="h-8 w-8 mb-2" />
                                        <div className="flex gap-2">
                                            <label className="text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm hover:bg-gray-100 cursor-pointer">
                                                Upload Image
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, block.id)} />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>
                )}

                {/* VIDEO */}
                {block.type === 'video' && (
                    <div className={`overflow-hidden ${isAdmin && !block.content ? "h-48 bg-gray-800 rounded-lg flex items-center justify-center text-white relative group/vid" : ""}`}>
                        {block.content ? (
                            <video src={block.content} controls className="w-full rounded-md bg-black max-h-[400px]" />
                        ) : isAdmin ? (
                            <>
                                <div className="absolute inset-0 bg-black/20 group-hover/vid:bg-black/40 transition-colors pointer-events-none"></div>
                                {uploadingBlockId === block.id ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-white z-10" />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 z-10">
                                        <div className="h-14 w-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
                                            <Play className="h-6 w-6 text-white ml-1" />
                                        </div>
                                        <label className="text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded shadow hover:bg-gray-100 tracking-widest uppercase cursor-pointer">
                                            Upload Video
                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, block.id)} />
                                        </label>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                )}

                {/* DIVIDER */}
                {block.type === 'divider' && (
                    <div className="py-2">
                        <div className="h-px w-full bg-gray-200"></div>
                    </div>
                )}

                {/* BUTTON */}
                {block.type === 'button' && (
                    <div className="flex justify-center" style={{ textAlign: block.properties?.textAlign }}>
                        <button style={{
                            backgroundColor: block.properties?.backgroundColor || "#3b82f6",
                            color: block.properties?.color || "#ffffff",
                            borderRadius: block.properties?.borderRadius || "8px",
                            padding: block.properties?.padding || "12px 24px",
                            fontWeight: "bold"
                        }}>{block.content}</button>
                    </div>
                )}

                {/* LAYOUT BLOCKS */}
                {["2_col", "3_col", "4_col", "row", "section"].includes(block.type) && (
                    <div
                        className={`${isAdmin ? 'mt-2' : ''} ${block.type === 'row' ? 'flex flex-row flex-wrap gap-4' :
                            block.type === 'section' ? 'flex flex-col gap-4' :
                                `grid gap-4 ${block.type === '2_col' ? 'grid-cols-1 md:grid-cols-2' :
                                    block.type === '3_col' ? 'grid-cols-1 md:grid-cols-3' :
                                        block.type === '4_col' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : ''
                                }`
                            }`}
                        onDrop={(e) => {
                            if (!isAdmin) return;
                            if (["row", "section"].includes(block.type)) {
                                handleDrop(e, block.id);
                            }
                            // Note: for 2_col gaps, we let the drop bubble up to handleInsertBefore
                        }}
                        onDragOver={handleDragOver}
                    >
                        {block.children?.length === 0 && isAdmin ? (
                            <div className="p-8 border-2 border-dashed border-gray-200 text-center text-gray-400 text-sm rounded-xl">Drop elements here</div>
                        ) : (
                            block.children?.map(child => renderBlock(child, false))
                        )}
                    </div>
                )}

                {/* COLUMNS INSIDE LAYOUT */}
                {block.type === "column" && (
                    <div
                        className={`flex flex-col gap-3 ${isAdmin ? 'min-h-[120px] bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-3' : 'min-h-[20px]'}`}
                        onDrop={(e) => isAdmin && handleDrop(e, block.id)}
                        onDragOver={handleDragOver}
                    >
                        {block.children?.length === 0 && isAdmin ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2 pointer-events-none">
                                <Plus className="h-5 w-5" />
                            </div>
                        ) : (
                            block.children?.map(child => renderBlock(child, false))
                        )}
                    </div>
                )}

                {isAdmin && block.type !== "column" && (
                    <button
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                        className="absolute -top-3 -right-3 h-8 w-8 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }

    const isPdfFullCover = lessonType === "pdf" && activePdf;

    return (
        <div className="flex flex-col h-full w-full bg-white relative">

            {/* Top Navigation Bar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-30 sticky top-0">
                <div className="hidden sm:block sm:w-[250px] md:w-[300px] lg:w-[400px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                        />
                    </div>
                </div>

                {/* Mobile Search Icon (only visible on mobile) */}
                <div className="sm:hidden text-gray-500 font-bold tracking-widest text-sm">
                    {viewMode === 'admin' ? "ADMIN DASHBOARD" : "STUDENT DASHBOARD"}
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <button className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <Bell className="h-4 w-4 text-gray-600" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">
                                {viewMode === 'admin' ? "Admin Account" : currentUserName || "Yosra Dianalan"}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {viewMode === 'admin' ? "Administrator" : "Student"}
                            </p>
                        </div>
                        <div className={`h-8 w-8 md:h-9 md:w-9 shrink-0 rounded-full ${viewMode === 'admin' ? 'bg-[#f5cdd0] text-[#ba5a62]' : 'bg-[#e4d7d8] text-gray-600'} border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs md:text-sm`}>
                            {viewMode === 'admin' ? "A" : (currentUserName ? currentUserName[0].toUpperCase() : "Y")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Builder Area */}
            <div 
                className={`flex-1 relative ${isPdfFullCover ? "overflow-hidden" : "overflow-y-auto p-8"} ${viewMode === "student" ? "select-none" : ""}`}
                onContextMenu={(e) => viewMode === 'student' && e.preventDefault()}
                onCopy={(e) => viewMode === 'student' && e.preventDefault()}
                onDragStart={(e) => viewMode === 'student' && e.preventDefault()}
                onKeyDown={(e) => {
                    if (viewMode === 'student' && (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 's' || e.key === 'p' || e.key === 'a')) {
                        e.preventDefault();
                    }
                }}
            >
                {lessonId ? (
                    isPdfFullCover ? (
                        /* ── PDF BUILDER FULL COVER ── */
                        <div className="w-full h-full relative" style={{ minHeight: 'calc(100vh - 64px)' }}>
                            {fetching ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : null}
                            <CustomPdfViewer
                                url={activePdf}
                                watermarkText={currentUserName}
                                isStudent={viewMode === "student"}
                            />
                        </div>
                    ) : (
                        <div className="w-full space-y-8 pb-32">

                            {/* ── PDF BUILDER UPLOAD STATE ── */}
                            {lessonType === "pdf" && !activePdf && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto mt-20">
                                    {!isStudent ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative flex flex-col items-center justify-center gap-4 w-full py-16 bg-white rounded-3xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#f5cdd0] hover:bg-[#fef9fa] transition-all group shadow-sm"
                                        >
                                            {uploading ? (
                                                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <div className="h-20 w-20 rounded-full bg-[#fef2f3] flex items-center justify-center group-hover:bg-[#f5cdd0] group-hover:scale-110 transition-all duration-300">
                                                        <Upload className="h-8 w-8 text-[#ba5a62]" />
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <p className="text-lg font-extrabold text-gray-700">Upload PDF Content</p>
                                                        <p className="text-sm font-medium text-gray-400">Click to browse or drag & drop your files here</p>
                                                    </div>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={handlePdfUpload}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
                                            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                                                <BookOpen className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-xl font-bold tracking-tight text-gray-500">No PDF Available</p>
                                            <p className="text-sm mt-2 text-center max-w-xs mx-auto">Your instructor has not uploaded a PDF for this lesson yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── MODULE BUILDER CANVAS ── */}
                            {lessonType === "module" && (
                                <div className="relative">
                                    {!isStudent && (
                                        <div className="flex justify-end mb-4 items-center gap-3">
                                            <button
                                                onClick={() => setViewMode(viewMode === 'admin' ? 'student' : 'admin')}
                                                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-full font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
                                            >
                                                {viewMode === 'admin' ? 'Student View' : 'Admin View'}
                                            </button>
                                            <button
                                                onClick={saveModuleBlocks}
                                                disabled={saving || fetching}
                                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                            </button>
                                        </div>
                                    )}
                                    <div
                                        className={`animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-[500px] bg-white ${viewMode === 'admin' ? 'border-2 border-dashed border-gray-300 rounded-3xl p-6 relative' : ''}`}
                                        onDrop={(e) => viewMode === 'admin' && handleDrop(e)}
                                        onDragOver={handleDragOver}
                                    >
                                        {blocks.length === 0 ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                                                <div className="h-16 w-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    <div className="grid grid-cols-2 gap-1.5 p-3 opacity-50">
                                                        <div className="bg-gray-300 h-2 w-full rounded"></div>
                                                        <div className="bg-gray-300 h-2 w-full rounded"></div>
                                                        <div className="col-span-2 bg-gray-300 h-4 w-8 rounded"></div>
                                                    </div>
                                                </div>
                                                <p className="text-sm flex items-center gap-2 font-bold tracking-widest uppercase text-center max-w-xs mx-auto">
                                                    {isStudent ? "Module content is empty" : "Drag items here to build"}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="w-full">
                                                {blocks.map((block) => renderBlock(block, true))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    /* ── BLANK STATE ── */
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                        <div className="h-32 w-32 bg-white rounded-3xl border border-gray-200 shadow-sm flex items-center justify-center mb-8 pb-2">
                            <div className="relative">
                                <FileText className="h-12 w-12 text-[#f5cdd0] absolute -left-4 top-2 rotate-[-15deg] opacity-60" />
                                <PenTool className="h-12 w-12 text-[#ba5a62] relative z-10" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-3">No Lesson Selected</h2>
                        <p className="text-gray-500 font-medium">
                            Select a lesson from the sidebar or create a new one to begin building content for <strong className="text-gray-700">{subject?.code}</strong>.
                        </p>
                    </div>
                )}
            </div>

            {/* STICKY TOOLBOX for MODULE BUILDER */}
            {viewMode === 'admin' && lessonId && lessonType === "module" && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 flex flex-col z-40 w-[600px] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-gray-50 p-2 border-b border-gray-100 overflow-x-auto custom-scrollbar">
                        {BLOCK_CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveToolCategory(category.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeToolCategory === category.id
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                    {/* Tools array for selected category */}
                    <div className="p-3 flex items-center gap-3 overflow-x-auto custom-scrollbar bg-white">
                        {BLOCK_CATEGORIES.find(c => c.id === activeToolCategory)?.items.map((item, idx) => (
                            <DraggableTool
                                key={idx}
                                icon={item.icon}
                                label={item.label}
                                type={item.type}
                                onDragStart={handleDragStart}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* PROPERTIES SIDEBAR */}
            {viewMode === 'admin' && activeBlock && (
                <div className="absolute top-16 right-0 w-80 bottom-0 bg-white border-l border-gray-200 shadow-xl z-50 p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm tracking-wide">
                            <Settings className="h-4 w-4 text-blue-500" />
                            {activeBlock.type.toUpperCase()} SETTINGS
                        </h3>
                        <button onClick={() => setActiveBlockId(null)} className="p-1 hover:bg-gray-100 rounded-md">
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Common properties */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Background Color</label>
                            <input
                                type="color"
                                value={activeBlock.properties?.backgroundColor || "#ffffff"}
                                onChange={(e) => updateBlockProperty(activeBlock.id, "backgroundColor", e.target.value)}
                                className="w-full h-10 cursor-pointer rounded-md border border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Padding</label>
                            <input
                                type="text"
                                value={activeBlock.properties?.padding || ""}
                                placeholder="eg. 1rem or 16px"
                                onChange={(e) => updateBlockProperty(activeBlock.id, "padding", e.target.value)}
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            />
                        </div>

                        {/* Text properties */}
                        {["text", "headline", "quote", "button", "bullet_list", "numbered_list"].includes(activeBlock.type) && (
                            <>
                                <hr className="border-gray-100" />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Text Color</label>
                                    <input
                                        type="color"
                                        value={activeBlock.properties?.color || "#333333"}
                                        onChange={(e) => updateBlockProperty(activeBlock.id, "color", e.target.value)}
                                        className="w-full h-10 cursor-pointer rounded-md border border-gray-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Font Size</label>
                                    <input
                                        type="text"
                                        value={activeBlock.properties?.fontSize || "16px"}
                                        onChange={(e) => updateBlockProperty(activeBlock.id, "fontSize", e.target.value)}
                                        className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Alignment</label>
                                    <div className="flex bg-gray-100 p-1.5 rounded-lg gap-1">
                                        <button onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "left")} className={`flex-1 flex justify-center py-2 rounded-md text-gray-600 transition-all ${activeBlock.properties?.textAlign === 'left' ? 'bg-white shadow-sm font-bold text-blue-600' : 'hover:bg-gray-200'}`}><AlignLeft className="h-4 w-4" /></button>
                                        <button onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "center")} className={`flex-1 flex justify-center py-2 rounded-md text-gray-600 transition-all ${activeBlock.properties?.textAlign === 'center' ? 'bg-white shadow-sm font-bold text-blue-600' : 'hover:bg-gray-200'}`}><AlignCenter className="h-4 w-4" /></button>
                                        <button onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "right")} className={`flex-1 flex justify-center py-2 rounded-md text-gray-600 transition-all ${activeBlock.properties?.textAlign === 'right' ? 'bg-white shadow-sm font-bold text-blue-600' : 'hover:bg-gray-200'}`}><AlignRight className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* URL properties for images/videos */}
                        {["image", "video"].includes(activeBlock.type) && (
                            <>
                                <hr className="border-gray-100" />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Media URL</label>
                                    <input
                                        type="text"
                                        value={activeBlock.content || ""}
                                        placeholder="https://..."
                                        onChange={(e) => updateBlockContent(activeBlock.id, e.target.value)}
                                        className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* FULLSCREEN IMAGE MODAL */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur transition-all"
                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center max-w-6xl">
                        <img
                            src={fullscreenImage}
                            className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-none"
                            alt="Fullscreen view"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function DraggableTool({ icon: Icon, label, type, onDragStart }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex flex-col items-center justify-start gap-1.5 min-w-[76px] h-[80px] p-2 rounded-xl hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors text-gray-500 hover:text-blue-600 group"
        >
            <div className="h-10 w-10 shrink-0 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-blue-200 group-hover:shadow transition-all group-active:scale-95">
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-center leading-tight">{label}</span>
        </div>
    )
}
