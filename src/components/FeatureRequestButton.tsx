import brand from '../config/brand'

interface Props {
  hidden: boolean
  onClick: () => void
}

export function FeatureRequestButton({ hidden, onClick }: Props) {
  if (hidden) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Suggest a feature"
      className="fixed bottom-20 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg text-white text-sm font-medium transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
      style={{
        background: brand.colours.primary,
        paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Lightbulb icon */}
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <span className="hidden sm:inline">Suggest a feature</span>
    </button>
  )
}
