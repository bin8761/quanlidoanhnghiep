export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}) {
  return (
    <header className="page-header">
      <div className="min-w-0">
        {eyebrow && (
          <div className="page-eyebrow">
            {Icon && <Icon aria-hidden="true" size={14} />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h2 className="page-title">{title}</h2>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
