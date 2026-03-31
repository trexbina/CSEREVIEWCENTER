import { Shield } from "lucide-react"

export default function SecurityPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Security &amp; IP Control</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Monitor active sessions, review access logs, and manage watermark settings.
                </p>
            </div>

            {/* Session Monitoring */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Session Monitoring</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Active user sessions and their IP addresses will be displayed here.
                </p>
            </div>

            {/* Access Logs */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Access Logs</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Login attempts, failed authentications, and suspicious activity logs will appear here.
                </p>
            </div>

            {/* Watermark Settings */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Watermark Settings</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Configure content watermarking to protect proprietary review materials.
                </p>
            </div>
        </div>
    )
}
