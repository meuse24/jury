import { Link } from 'react-router-dom'

interface Props {
  emoji?: string
  title: string
  description?: string
  action?: { label: string; to: string }
}

export default function EmptyState({ emoji = '📋', title, description, action }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-10 text-center space-y-3">
      <div className="text-4xl text-gray-200">{emoji}</div>
      <p className="text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="inline-block bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded text-sm transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
