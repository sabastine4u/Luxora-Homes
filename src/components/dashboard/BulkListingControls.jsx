const bulkStatuses = [
  ['Active', 'Active'],
  ['Pending', 'Pending'],
  ['Sold', 'Sold'],
  ['Off-Market', 'Off Market'],
]

export default function BulkListingControls({ selectedCount, onApplyStatus, onClear }) {
  if (!selectedCount) return null

  return (
    <div className="bulk-listing-controls">
      <strong>{selectedCount} selected</strong>
      <div>
        {bulkStatuses.map(([value, label]) => (
          <button type="button" onClick={() => onApplyStatus(value)} key={value}>
            Mark {label}
          </button>
        ))}
        <button type="button" onClick={onClear}>Clear</button>
      </div>
    </div>
  )
}
