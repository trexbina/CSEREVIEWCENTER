"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { toast } from "@/components/ui/toast"

/** Gradebooks are examination-owned. Subscriptions control access; no cohort is used. */
export default function GradebookView({ onBack, tree = [], gradebooks = [], fetchData, apiCall }) {
  const examinations = useMemo(() => tree.map(({ id, name }) => ({ id, name })), [tree])
  const [selectedExam, setSelectedExam] = useState("all")
  const [editor, setEditor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const visibleGradebooks = gradebooks.filter((gradebook) => selectedExam === "all" || String(gradebook.exam_id) === selectedExam)

  function openEditor(gradebook = null) {
    setEditor(gradebook
      ? { id: gradebook.id, name: gradebook.name || "", code: gradebook.code || "", exam_id: String(gradebook.exam_id || ""), status: gradebook.status || "ACTIVE" }
      : { id: null, name: "", code: "", exam_id: selectedExam === "all" ? "" : selectedExam, status: "ACTIVE" })
  }

  async function save(event) {
    event.preventDefault()
    if (!editor?.name.trim() || !editor.exam_id) return
    setSaving(true)
    try {
      const result = await apiCall(editor.id ? "UPDATE" : "ADD", "GRADEBOOK", { ...editor, exam_id: Number(editor.exam_id), targets: [`exam_${editor.exam_id}`] })
      if (result?.error) throw new Error(result.error)
      await fetchData()
      setEditor(null)
      toast(editor.id ? "Gradebook updated." : "Gradebook created.")
    } catch (error) {
      toast(error.message || "Unable to save the gradebook.")
    } finally {
      setSaving(false)
    }
  }

  async function removeGradebook() {
    if (!deleting) return
    try {
      const result = await apiCall("DELETE", "GRADEBOOK", { id: deleting.id })
      if (result?.error) throw new Error(result.error)
      await fetchData()
      toast("Gradebook removed.")
    } catch (error) {
      toast(error.message || "Unable to remove the gradebook.")
    } finally {
      setDeleting(null)
    }
  }

  return <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><button onClick={onBack} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Back to Master Data"><ArrowLeft className="size-4" /></button><div><h2 className="text-xl font-bold text-foreground">Gradebooks by Examination</h2><p className="text-sm text-muted-foreground">Student results and readiness are grouped by examination.</p></div></div>
      <button onClick={() => openEditor()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E9C46A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dfb550]"><Plus className="size-4" />Create Gradebook</button>
    </div>
    <div className="flex flex-wrap gap-2"><button onClick={() => setSelectedExam("all")} className={`rounded-full px-4 py-2 text-sm font-medium ${selectedExam === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>All examinations</button>{examinations.map((exam) => <button key={exam.id} onClick={() => setSelectedExam(String(exam.id))} className={`rounded-full px-4 py-2 text-sm font-medium ${selectedExam === String(exam.id) ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{exam.name}</button>)}</div>
    <div className="overflow-hidden rounded-2xl border border-border bg-card">{visibleGradebooks.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No gradebooks for this examination yet.</p> : <table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Gradebook</th><th className="px-5 py-3">Examination</th><th className="px-5 py-3">Students</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{visibleGradebooks.map((gradebook) => <tr key={gradebook.id}><td className="px-5 py-4 font-medium">{gradebook.name}<span className="ml-2 text-xs text-muted-foreground">{gradebook.code || ""}</span></td><td className="px-5 py-4">{gradebook.exam_name || "—"}</td><td className="px-5 py-4">{gradebook.student_count || 0}</td><td className="px-5 py-4">{gradebook.status || "ACTIVE"}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEditor(gradebook)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Edit gradebook"><Pencil className="size-4" /></button><button onClick={() => setDeleting(gradebook)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label="Delete gradebook"><Trash2 className="size-4" /></button></div></td></tr>)}</tbody></table>}</div>
    {editor && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl"><div><h3 className="text-lg font-bold">{editor.id ? "Edit" : "Create"} Gradebook</h3><p className="text-sm text-muted-foreground">This gradebook belongs to one examination.</p></div><label className="block text-sm font-medium">Name<input required value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label><label className="block text-sm font-medium">Code<input value={editor.code} onChange={(event) => setEditor({ ...editor, code: event.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label><label className="block text-sm font-medium">Examination<select required value={editor.exam_id} onChange={(event) => setEditor({ ...editor, exam_id: event.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"><option value="">Select examination</option>{examinations.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label><label className="block text-sm font-medium">Status<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditor(null)} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button><button disabled={saving} className="rounded-lg bg-[#E9C46A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div></form></div>}
    <ConfirmDeleteModal isOpen={Boolean(deleting)} title="Delete Gradebook" description={`Delete ${deleting?.name || "this gradebook"}?`} onConfirm={removeGradebook} onCancel={() => setDeleting(null)} isDeleting={false} />
  </div>
}
