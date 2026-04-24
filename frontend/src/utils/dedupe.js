export const dedupeBy = (items, getKey) => {
  if (!Array.isArray(items)) return []

  const seen = new Set()

  return items.filter((item, index) => {
    const key = String(getKey(item, index))
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

