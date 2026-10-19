import { SecurityShield } from "@/components/security-shield"

export default function StudentLayout({ children }) {
  // TEMPORARILY DISABLED: Student screenshot & security shield restrictions
  return <>{children}</>

  /*
  return (
    <SecurityShield
      blurOnFocusLoss={true}
      blockDevTools={true}
      redirectToOnDevTools="/student/security-violation"
    >
      {children}
    </SecurityShield>
  )
  */
}

