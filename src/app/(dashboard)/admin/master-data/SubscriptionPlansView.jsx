"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Eye, Plus, Save } from "lucide-react"
import { toast } from "@/components/ui/toast"

const emptyPlan = { examination_id: "", name: "", description: "", price: "", billing_interval: "monthly", plan_type: "paid", access_mode: "all", is_default_free: false, status: "active", subject_ids: [], mock_exam_ids: [] }

export default function SubscriptionPlansView({ onBack }) {
  const router = useRouter()
  const [data, setData] = useState({ plans: [], examinations: [], subjects: [], mockExams: [] })
  const [screen, setScreen] = useState("home")
  const [selectedExamId, setSelectedExamId] = useState("")
  const [form, setForm] = useState(emptyPlan)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/subscription-plans")
      const payload = await response.json()
      if (response.ok) setData(payload)
      else toast(payload.error || "Failed to load subscription plans.")
    } catch { toast("Unable to load subscription plans.") } finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const resetToHome = () => { setScreen("home"); setEditingId(null); setForm(emptyPlan); setSelectedExamId("") }
  const toggle = (key, id) => setForm((current) => ({ ...current, [key]: current[key].includes(id) ? current[key].filter((value) => value !== id) : [...current[key], id] }))
  const edit = (plan) => {
    setEditingId(plan.id)
    setForm({ ...emptyPlan, ...plan, examination_id: String(plan.examination_id), price: plan.price ?? "", billing_interval: plan.billing_interval === "annual" ? "annual" : "monthly", subject_ids: (plan.subject_ids || []).map(Number), mock_exam_ids: (plan.mock_exam_ids || []).map(Number) })
    setScreen("create")
  }
  const startCreate = (examId = "") => { setEditingId(null); setForm({ ...emptyPlan, examination_id: examId }); setScreen("create") }

  const save = async (event) => {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch("/api/admin/subscription-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: editingId ? "UPDATE" : "CREATE", plan: { ...form, id: editingId, examination_id: Number(form.examination_id), price: form.price === "" ? null : Number(form.price) } }) })
      const payload = await response.json()
      if (!response.ok) return toast(payload.error || "Unable to save plan.")
      toast(editingId ? "Subscription plan updated." : "Subscription plan created.")
      await load(); setSelectedExamId(String(form.examination_id)); setEditingId(null); setForm(emptyPlan); setScreen("view")
    } catch { toast("Unable to save plan.") } finally { setSaving(false) }
  }
  const remove = async (id) => {
    if (!window.confirm("Delete this subscription plan? Existing subscription history will be retained.")) return
    const response = await fetch("/api/admin/subscription-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "DELETE", plan: { id } }) })
    if (response.ok) { toast("Subscription plan deleted."); void load() } else toast("Unable to delete a plan with active history.")
  }

  const filteredPlans = data.plans.filter((plan) => String(plan.examination_id) === selectedExamId)
  const selectedExam = data.examinations.find((exam) => String(exam.id) === selectedExamId)
  const back = screen === "home" ? (onBack || (() => router.back())) : resetToHome

  return <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
    <button onClick={back} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> {screen === "home" ? "Back to Master Data" : "Subscription Plans"}</button>

    {screen === "home" && <>
      <div className="max-w-2xl space-y-2"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9952F]">Master Data</p><h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Subscription Plans</h2><p className="text-base text-muted-foreground">Create and manage Monthly, Annual, and Free plans for each examination.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <button onClick={() => startCreate()} className="group min-h-64 rounded-3xl border border-[#E9C46A]/40 bg-[#FFF9E8] p-8 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E9C46A] hover:shadow-md dark:bg-[#E9C46A]/10"><span className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#E9C46A] text-white"><Plus className="size-7" /></span><h3 className="text-2xl font-bold text-foreground">Create New Plan</h3><p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">Set the examination, access type, Monthly or Annual price, and included study materials.</p><span className="mt-8 inline-flex items-center gap-1 text-sm font-bold text-[#B7811D]">Start creating <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></span></button>
        <button onClick={() => setScreen("view")} className="group min-h-64 rounded-3xl border border-border bg-card p-8 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E9C46A] hover:shadow-md"><span className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#F4F1EA] text-[#9A701F] dark:bg-white/10"><Eye className="size-7" /></span><h3 className="text-2xl font-bold text-foreground">View Plans</h3><p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">Choose an examination to see its current plans, prices, and access settings.</p><span className="mt-8 inline-flex items-center gap-1 text-sm font-bold text-[#B7811D]">View existing plans <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></span></button>
      </div>
    </>}

    {screen === "create" && <form onSubmit={save} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C9952F]">Subscription Plan</p><h2 className="mt-1 text-3xl font-bold text-foreground">{editingId ? "Edit Plan" : "Create New Plan"}</h2><p className="mt-2 text-base text-muted-foreground">Plans are specific to the examination you choose below.</p></div>{editingId && <button type="button" onClick={() => startCreate()} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel edit</button>}</div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-foreground">Examination<select required value={form.examination_id} onChange={(e) => setForm({ ...form, examination_id: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal"><option value="">Select examination</option>{data.examinations.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>
        <label className="space-y-2 text-sm font-semibold text-foreground">Plan name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Review Access" className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal" /></label>
        <label className="space-y-2 text-sm font-semibold text-foreground">Access type<select value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value, is_default_free: e.target.value === "free" ? form.is_default_free : false })} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal"><option value="paid">Paid</option><option value="free">Free</option></select></label>
        {form.plan_type === "paid" ? <label className="space-y-2 text-sm font-semibold text-foreground">Billing interval<select value={form.billing_interval} onChange={(e) => setForm({ ...form, billing_interval: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label> : <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Free plans do not expire.</div>}
        {form.plan_type === "paid" && <label className="space-y-2 text-sm font-semibold text-foreground md:col-span-2">Price for this examination (PHP)<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal" /></label>}
        <label className="space-y-2 text-sm font-semibold text-foreground md:col-span-2">Description<textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description shown with this plan" className="min-h-24 w-full rounded-xl border border-border bg-background p-4 text-base font-normal" /></label>
      </div>
      <div className="mt-7 space-y-4 border-t border-border pt-7"><label className="flex items-center gap-3 text-base font-semibold"><input type="checkbox" checked={form.is_default_free} disabled={form.plan_type !== "free"} onChange={(e) => setForm({ ...form, is_default_free: e.target.checked })} className="size-4" /> Default Free plan for this examination</label><label className="space-y-2 text-sm font-semibold text-foreground">Included content<select value={form.access_mode} onChange={(e) => setForm({ ...form, access_mode: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-normal"><option value="all">All content for this examination</option><option value="selected">Only selected subjects and mock exams</option></select></label>
        {form.access_mode === "selected" && <div className="grid gap-4 md:grid-cols-2"><div className="max-h-52 overflow-auto rounded-xl border border-border p-4"><p className="mb-3 text-sm font-bold">Subjects</p>{data.subjects.map((subject) => <label key={subject.id} className="flex gap-2 py-1.5 text-sm"><input type="checkbox" checked={form.subject_ids.includes(subject.id)} onChange={() => toggle("subject_ids", subject.id)} />{subject.title}</label>)}</div><div className="max-h-52 overflow-auto rounded-xl border border-border p-4"><p className="mb-3 text-sm font-bold">Mock exams</p>{data.mockExams.map((mock) => <label key={mock.id} className="flex gap-2 py-1.5 text-sm"><input type="checkbox" checked={form.mock_exam_ids.includes(mock.id)} onChange={() => toggle("mock_exam_ids", mock.id)} />{mock.title}</label>)}</div></div>}
      </div>
      <div className="mt-8 flex justify-end"><button disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#E9C46A] px-6 text-base font-bold text-white transition-colors hover:bg-[#D8B150] disabled:opacity-60"><Save className="size-5" />{saving ? "Saving…" : editingId ? "Save Changes" : "Create Plan"}</button></div>
    </form>}

    {screen === "view" && <section className="space-y-7"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C9952F]">Existing Plans</p><h2 className="mt-1 text-3xl font-bold text-foreground">Choose an examination</h2><p className="mt-2 text-base text-muted-foreground">Select an examination to see and edit its subscription plans.</p></div><select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)} className="h-14 w-full max-w-2xl rounded-xl border border-border bg-card px-5 text-lg font-medium shadow-sm"><option value="">Select examination</option>{data.examinations.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select>
      {selectedExamId && <div className="rounded-3xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-8"><div><h3 className="text-xl font-bold">{selectedExam?.name}</h3><p className="text-sm text-muted-foreground">{filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"} configured</p></div><button onClick={() => startCreate(selectedExamId)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E9C46A] px-4 text-sm font-bold text-white"><Plus className="size-4" /> New plan</button></div><div className="divide-y divide-border">{loading ? <p className="p-8 text-base text-muted-foreground">Loading plans…</p> : filteredPlans.length ? filteredPlans.map((plan) => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-5 px-6 py-6 sm:px-8"><div><p className="text-lg font-bold text-foreground">{plan.name}</p><p className="mt-1 text-sm text-muted-foreground">{plan.plan_type === "free" ? "Free · no expiry" : `${plan.billing_interval === "annual" ? "Annual" : "Monthly"} · ₱${Number(plan.price || 0).toLocaleString("en-PH")}`} · {plan.access_mode === "all" ? "All content" : "Selected content"}</p></div><div className="flex items-center gap-4"><button onClick={() => remove(plan.id)} className="text-sm font-semibold text-destructive hover:underline">Delete</button><button onClick={() => edit(plan)} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted">Edit plan</button></div></div>) : <div className="px-8 py-12 text-center"><p className="text-lg font-semibold">No plans for this examination yet.</p><button onClick={() => startCreate(selectedExamId)} className="mt-4 text-sm font-bold text-[#B7811D] hover:underline">Create the first plan</button></div>}</div></div>}
    </section>}
  </div>
}
