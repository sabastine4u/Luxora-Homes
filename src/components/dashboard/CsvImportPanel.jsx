import { useState } from 'react'

const fallbackImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=70'
const requiredColumns = ['title', 'location', 'price', 'category', 'beds', 'baths', 'status', 'image']

const splitCsvLine = (line = '') => {
  const cells = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && next === '"') {
      value += '"'
      index += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }

  cells.push(value.trim())
  return cells
}

export default function CsvImportPanel({ agent, createListing, onImported }) {
  const [errors, setErrors] = useState([])
  const [summary, setSummary] = useState('')

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) return { listings: [], errors: ['CSV needs a header row and at least one listing row.'] }

    const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase())
    const missingColumns = requiredColumns.filter((column) => !headers.includes(column))
    const nextErrors = missingColumns.map((column) => `Missing column: ${column}`)
    const listings = []

    lines.slice(1).forEach((line, index) => {
      const rowNumber = index + 2
      const cells = splitCsvLine(line)
      if (cells.length !== headers.length) {
        nextErrors.push(`Row ${rowNumber}: column count does not match the header.`)
        return
      }

      const row = headers.reduce((items, header, cellIndex) => ({ ...items, [header]: cells[cellIndex] || '' }), {})
      const price = Number(row.price)
      const beds = Number(row.beds)
      const baths = Number(row.baths)
      if (!(row.title || '').trim()) nextErrors.push(`Row ${rowNumber}: title is required.`)
      if (!(row.location || '').trim()) nextErrors.push(`Row ${rowNumber}: location is required.`)
      if (!Number.isFinite(price) || price <= 0) nextErrors.push(`Row ${rowNumber}: price must be a positive number.`)
      if (!Number.isFinite(beds) || beds < 0) nextErrors.push(`Row ${rowNumber}: beds must be zero or more.`)
      if (!Number.isFinite(baths) || baths < 0) nextErrors.push(`Row ${rowNumber}: baths must be zero or more.`)

      if (nextErrors.some((error) => error.startsWith(`Row ${rowNumber}:`))) return

      listings.push({
        title: (row.title || '').trim(),
        location: (row.location || '').trim(),
        price,
        category: (row.category || '').trim() || 'Apartment',
        beds,
        baths,
        status: (row.status || '').trim() || 'Pending',
        image: (row.image || '').trim() || fallbackImage,
        images: [(row.image || '').trim() || fallbackImage],
        type: 'rent',
        sqft: 0,
        description: '',
        amenities: [],
        agent,
      })
    })

    return { listings, errors: nextErrors }
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    setSummary('')
    if (!file) return

    const text = await file.text()
    const result = parseCsv(text)
    setErrors(result.errors)
    if (result.errors.length) return

    result.listings.forEach((listing) => createListing(listing))
    setSummary(`${result.listings.length} listings imported.`)
    onImported?.(result.listings.length)
    event.target.value = ''
  }

  return (
    <div className="csv-import-panel">
      <label>
        CSV Import
        <input type="file" accept=".csv,text/csv" onChange={handleUpload} />
      </label>
      {summary && <small>{summary}</small>}
      {errors.length > 0 && (
        <div className="csv-import-errors">
          {errors.map((error) => <small className="form-error" key={error}>{error}</small>)}
        </div>
      )}
    </div>
  )
}
