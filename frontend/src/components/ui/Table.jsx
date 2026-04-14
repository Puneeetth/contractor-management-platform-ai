import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export const Table = ({ 
  columns, 
  data, 
  isLoading = false,
  currentPage = 1,
  pageSize = 10,
  total = 0,
  onPageChange = () => {},
}) => {
  const totalPages = Math.ceil(total / pageSize)
  const showPagination = total > pageSize

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No data found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-white/[0.03] transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-slate-300"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex justify-between items-center mt-4 px-6 pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages} • {total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
