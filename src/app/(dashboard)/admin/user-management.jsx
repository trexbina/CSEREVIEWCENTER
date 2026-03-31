"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Pencil, Trash2, BookOpen, Plus, X, Save,
  Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ─── Add User Form ──────────────────────────────────────
export function AddUserForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create user.")
        setLoading(false)
        return
      }

      setSuccess(`Created ${data.user.role} account for ${data.user.email}`)
      setName("")
      setEmail("")
      setPassword("")
      setRole("student")
      setLoading(false)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="new-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="new-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@school.edu"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-role" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Add User"}
      </button>
    </form>
  )
}

// ─── Delete User Button ─────────────────────────────────
export function DeleteUserButton({ userId, userName }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to delete user.")
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert("Network error.")
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

// ─── Edit User Dialog ───────────────────────────────────
export function EditUserDialog({ open, onOpenChange, user }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("student")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setRole(user.role || "student")
      setPassword("")
      setError("")
    }
  }, [open, user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const body = { name, email, role }
      if (password.trim()) body.password = password.trim()

      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to update user.")
        setSaving(false)
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Network error.")
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user details. Leave password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                minLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" /> Update User
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Shared helpers ────────────────────────────────────
const roleBadgeColor = {
  admin: "bg-destructive/15 text-destructive",
  teacher: "bg-primary/15 text-primary",
  student: "bg-secondary text-secondary-foreground",
}

function SortButton({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

function ActionButtons({ user, currentUserId, onEdit, onAssign }) {
  if (user.id === currentUserId) return null
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit user details</TooltipContent>
        </Tooltip>

        {user.role === "student" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onAssign(user)}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Assign subjects to this student</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DeleteUserButton userId={user.id} userName={user.name} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-destructive">Permanently delete this user</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

// ─── User Search Table (shown on /admin/users) ──────────
export function UserSearchTable({ users, currentUserId }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // 1-second debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 1000)
    return () => clearTimeout(timer)
  }, [query])

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const hasQuery = debouncedQuery.trim().length > 0
  const isDebouncing = query.trim() !== debouncedQuery.trim() && query.trim().length > 0

  const filtered = useMemo(() => {
    if (!hasQuery) return []
    const q = debouncedQuery.toLowerCase().trim()
    return users
      .filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let av = a[sortField] ?? ""
        let bv = b[sortField] ?? ""
        if (sortField === "created_at") {
          av = new Date(av).getTime()
          bv = new Date(bv).getTime()
        } else {
          av = String(av).toLowerCase()
          bv = String(bv).toLowerCase()
        }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
      })
      .slice(0, 8)
  }, [users, debouncedQuery, hasQuery, sortField, sortDir])

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => router.push("/admin/users/all")}
              >
                View All
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>See the full user list with advanced filters</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mdc-data-table w-full">
        <div className="mdc-data-table__table-container">
          <table className="mdc-data-table__table" aria-label="User search results">
            <thead>
              <tr className="mdc-data-table__header-row">
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell text-right" role="columnheader" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="mdc-data-table__content">
              {isDebouncing ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr className="mdc-data-table__row" key={`skel-${i}`}>
                    <td className="mdc-data-table__cell"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-4 w-40 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell text-right"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))
              ) : !hasQuery ? (
                <tr className="mdc-data-table__row">
                  <td className="mdc-data-table__cell py-12 text-center text-muted-foreground" colSpan={5}>
                    <Search className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Type a name, email, or role to search users
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="mdc-data-table__row">
                  <td className="mdc-data-table__cell py-8 text-center text-muted-foreground" colSpan={5}>
                    No users matching &quot;{debouncedQuery}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr className="mdc-data-table__row" key={user.id}>
                    <td className="mdc-data-table__cell font-medium">{user.name}</td>
                    <td className="mdc-data-table__cell text-muted-foreground">{user.email}</td>
                    <td className="mdc-data-table__cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] || "bg-secondary text-secondary-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="mdc-data-table__cell text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                    </td>
                    <td className="mdc-data-table__cell text-right">
                      <ActionButtons
                        user={user}
                        currentUserId={currentUserId}
                        onEdit={(u) => { setSelected(u); setEditOpen(true) }}
                        onAssign={(u) => { setSelected(u); setAssignOpen(true) }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasQuery && filtered.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {users.filter((u) => {
            const q = debouncedQuery.toLowerCase().trim()
            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
          }).length} matching users.{" "}
          <button onClick={() => router.push("/admin/users/all")} className="underline hover:text-foreground transition-colors">
            View all {users.length} users →
          </button>
        </p>
      )}

      {selected && (
        <>
          <EditUserDialog
            open={editOpen}
            onOpenChange={(v) => { setEditOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
          <AssignSubjectsDialog
            open={assignOpen}
            onOpenChange={(v) => { setAssignOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
        </>
      )}
    </>
  )
}

// ─── Full User Table (used on /admin/users/all) ─────────
export function UserTable({ users, currentUserId }) {
  const [sortField, setSortField] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() =>
    [...users].sort((a, b) => {
      let av = a[sortField] ?? ""
      let bv = b[sortField] ?? ""
      if (sortField === "created_at") {
        av = new Date(av).getTime()
        bv = new Date(bv).getTime()
      } else {
        av = String(av).toLowerCase()
        bv = String(bv).toLowerCase()
      }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    , [users, sortField, sortDir])

  return (
    <>
      <div className="mdc-data-table w-full">
        <div className="mdc-data-table__table-container">
          <table className="mdc-data-table__table" aria-label="All users">
            <thead>
              <tr className="mdc-data-table__header-row">
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell text-right" role="columnheader" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="mdc-data-table__content">
              {sorted.length === 0 ? (
                <tr className="mdc-data-table__row">
                  <td className="mdc-data-table__cell py-8 text-center text-muted-foreground" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                sorted.map((user) => (
                  <tr className="mdc-data-table__row" key={user.id}>
                    <td className="mdc-data-table__cell font-medium">{user.name}</td>
                    <td className="mdc-data-table__cell text-muted-foreground">{user.email}</td>
                    <td className="mdc-data-table__cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] || "bg-secondary text-secondary-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="mdc-data-table__cell text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                    </td>
                    <td className="mdc-data-table__cell text-right">
                      <ActionButtons
                        user={user}
                        currentUserId={currentUserId}
                        onEdit={(u) => { setSelected(u); setEditOpen(true) }}
                        onAssign={(u) => { setSelected(u); setAssignOpen(true) }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <EditUserDialog
            open={editOpen}
            onOpenChange={(v) => { setEditOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
          <AssignSubjectsDialog
            open={assignOpen}
            onOpenChange={(v) => { setAssignOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
        </>
      )}
    </>
  )
}

// ─── Assign Subjects Dialog ─────────────────────────────
export function AssignSubjectsDialog({ open, onOpenChange, user }) {
  const [assigned, setAssigned] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/student-subjects?studentId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAssigned(data.assigned)
        setAllSubjects(data.subjects)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (open && user) loadData()
  }, [open, user, loadData])

  // subjects not yet assigned
  const assignedIds = new Set(assigned.map((a) => a.id))
  const available = allSubjects.filter((s) => !assignedIds.has(s.id))

  async function handleAssign(subjectId) {
    setAssigning(true)
    try {
      const res = await fetch("/api/admin/student-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: user.id, subject_id: subjectId }),
      })
      if (res.ok) await loadData()
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemove(subjectId) {
    setRemoving(subjectId)
    try {
      await fetch(
        `/api/admin/student-subjects?studentId=${user.id}&subjectId=${subjectId}`,
        { method: "DELETE" }
      )
      await loadData()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Assign Subjects
          </DialogTitle>
          <DialogDescription>
            Manage subject assignments for <strong>{user?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Assigned subjects */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Assigned Subjects ({assigned.length})
                </h3>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
                    No subjects assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assigned.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {s.code}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {s.title}
                          </span>
                          {s.category && (
                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(s.id)}
                          disabled={removing === s.id}
                        >
                          {removing === s.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available subjects to add */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Available Subjects ({available.length})
                </h3>
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
                    {allSubjects.length === 0
                      ? "No subjects created yet. Create subjects in Curriculum Manager first."
                      : "All subjects have been assigned."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {available.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {s.code}
                          </Badge>
                          <span className="text-sm truncate">
                            {s.title}
                          </span>
                          {s.category && (
                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          onClick={() => handleAssign(s.id)}
                          disabled={assigning}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
