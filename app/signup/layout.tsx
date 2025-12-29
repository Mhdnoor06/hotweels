import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a Wheels Frames account to start collecting premium die-cast model cars.',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
