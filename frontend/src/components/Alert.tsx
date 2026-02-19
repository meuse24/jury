interface Props {
  type?: 'error' | 'success' | 'info'
  children: React.ReactNode
}

const styles = {
  error:   'bg-red-50 border-red-300 text-red-800',
  success: 'bg-green-50 border-green-300 text-green-800',
  info:    'bg-blue-50 border-blue-300 text-blue-800',
}

export default function Alert({ type = 'error', children }: Props) {
  return (
    <div className={`border rounded px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}
