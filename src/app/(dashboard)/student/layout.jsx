import { SecurityShield } from "@/components/security-shield"

export default function StudentLayout({ children }) {
  return <SecurityShield blurOnFocusLoss={true}>{children}</SecurityShield>
}

