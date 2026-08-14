import DefaultLayout from "@/components/layout/DefaultLayout"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <DefaultLayout>{children}</DefaultLayout>
}
