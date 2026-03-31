import { FolderOpen } from "lucide-react"

export default function ContentVaultPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <FolderOpen className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Content Vault</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Organize and manage review materials by category and LET competency area.
                </p>
            </div>

            {/* Categories */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Categories</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    No content categories have been created yet. Create categories to organize your review materials.
                </p>
            </div>

            {/* Recent Uploads */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Recent Uploads</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Recently uploaded materials will appear here.
                </p>
            </div>
        </div>
    )
}
