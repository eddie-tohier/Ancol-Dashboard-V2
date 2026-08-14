interface CardDataStatsProps {
  title: string
  total: string | number
  icon: React.ReactNode
  children?: React.ReactNode
}

export default function CardDataStats({ title, total, icon, children }: CardDataStatsProps) {
  return (
    <div className="card card--stats">
      <div className="card__header">
        <div className="card__icon">{icon}</div>
      </div>
      <div className="card__body">
        <span className="card__title">{title}</span>
        <h3 className="card__total">{total}</h3>
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  )
}
