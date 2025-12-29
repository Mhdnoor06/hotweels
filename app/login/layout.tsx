import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your Wheels Frames account to track orders and manage your wishlist.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
