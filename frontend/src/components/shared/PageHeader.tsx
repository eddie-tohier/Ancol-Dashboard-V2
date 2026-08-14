import Breadcrumb from "@/components/layout/Breadcrumb"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="page__header">
      <div className="page__headline">
        <h1 className="page__title">
          <span>{title}</span>
        </h1>
        {description && <p className="page__description">{description}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <Breadcrumb pageName={title} />
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
