import { SecurityShield } from "@/components/security-shield"

export default function NCLEXStudentDashboardLayout({ children }) {
  return <SecurityShield blurOnFocusLoss blockDevTools redirectToOnDevTools="/student/security-violation">{children}</SecurityShield>
}

