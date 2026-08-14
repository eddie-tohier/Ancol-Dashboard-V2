import Link from "next/link"

interface BreadcrumbProps {
  pageName: string
}

export default function Breadcrumb({ pageName }: BreadcrumbProps) {
  return (
    <nav className="flex justify-end">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link className="font-medium text-primary" href="/dashboard">
            Dashboard /
          </Link>
        </li>
        <li className="font-medium text-muted-foreground">{pageName}</li>
      </ol>
    </nav>
  )
}
