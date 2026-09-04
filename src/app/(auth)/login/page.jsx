import { redirect } from "next/navigation"

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const callbackUrl = params?.callbackUrl
  if (callbackUrl) {
    redirect(`/?login=1&callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }
  redirect("/?login=1")
}
