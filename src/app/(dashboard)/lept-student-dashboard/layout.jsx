import { SecurityShield } from "@/components/security-shield"

export default function LEPTStudentDashboardLayout({ children }) {
  return <SecurityShield blurOnFocusLoss blockDevTools redirectToOnDevTools="/student/security-violation">{children}</SecurityShield>
}

