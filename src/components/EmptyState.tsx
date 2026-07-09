export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <div className="text-4xl mb-2">{icon ?? '🌱'}</div>
      <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--color-ink-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
