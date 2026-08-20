import { SecurityShield } from "@/components/security-shield"

export default function StudentLayout({ children }) {
  return <SecurityShield>{children}</SecurityShield>
}
