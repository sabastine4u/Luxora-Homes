import { Link } from 'react-router-dom'

export default function Button({ children, href = '#', variant = 'primary', className = '', onClick }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
  if (isExternal) {
    return (
      <a className={`btn btn-${variant} ${className}`} href={href} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link className={`btn btn-${variant} ${className}`} to={href} onClick={onClick}>
      {children}
    </Link>
  )
}
