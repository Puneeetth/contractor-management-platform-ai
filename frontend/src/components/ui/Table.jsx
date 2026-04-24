import React, { useEffect, useMemo, useState } from 'react'

export const Table = ({ columns = [], data = [], className = '', pageSize = 10 }) => {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const pageRows = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, endIndex, startIndex]
  )

  useEffect(() => {
    setPage(1)
  }, [data.length, pageSize])

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-2.5 text-left font-semibold text-gray-700">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((row, rowIndex) => (
              <tr key={row.id || `${currentPage}-${rowIndex}`} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > pageSize && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {data.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-500 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="inline-flex min-w-8 justify-center rounded-lg border border-[#d5deec] bg-white px-2 py-1 text-sm font-semibold text-[#3b52d8]">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
