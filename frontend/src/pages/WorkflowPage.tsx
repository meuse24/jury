import { Link } from 'react-router-dom'

export default function WorkflowPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/hilfe"
          className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          aria-label="Zurück zur Hilfe"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Workflow-Infografik</h1>
          <p className="text-sm text-gray-500">Schritt-für-Schritt-Übersicht für Admin und Jury</p>
        </div>
      </div>

      {/* Scrollbarer Bild-Container */}
      <div className="bg-white shadow rounded-xl overflow-auto border border-gray-100">
        <img
          src={`${import.meta.env.BASE_URL}workflow.jpg`}
          alt="Workflow-Infografik: Schritt-für-Schritt-Übersicht für Admin und Jury"
          className="max-w-none"
          style={{ display: 'block' }}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Bild scrollbar wenn es breiter als der Bildschirm ist.{' '}
        <Link to="/hilfe" className="hover:underline">Zurück zur Hilfe</Link>
      </p>
    </div>
  )
}
