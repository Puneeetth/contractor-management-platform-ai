const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const PAGE_MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

const sanitizeText = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const truncateText = (value, maxChars) => {
  const text = String(value ?? '')
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 3))}...`
}

const wrapText = (value, maxChars) => {
  const text = String(value ?? '').trim()
  if (!text) return ['-']

  const words = text.split(/\s+/)
  const lines = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      return
    }

    if (current) lines.push(current)

    if (word.length > maxChars) {
      let remaining = word
      while (remaining.length > maxChars) {
        lines.push(`${remaining.slice(0, Math.max(0, maxChars - 1))}-`)
        remaining = remaining.slice(Math.max(0, maxChars - 1))
      }
      current = remaining
      return
    }

    current = word
  })

  if (current) lines.push(current)
  return lines
}

const pdfText = (text, x, y, size = 10, font = 'F1') =>
  `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${sanitizeText(text)}) Tj ET`

const pdfLine = (x1, y1, x2, y2) => `${x1} ${y1} m ${x2} ${y2} l S`
const pdfRectFill = (x, y, width, height) => `${x} ${y} ${width} ${height} re f`

const buildPdf = (pageStreams) => {
  const pageCount = pageStreams.length
  const pageObjectStart = 5
  const pageObjectRefs = Array.from({ length: pageCount }, (_, index) => `${pageObjectStart + index * 2} 0 R`)

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectRefs.join(' ')}] /Count ${pageCount} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  pageStreams.forEach((stream, index) => {
    const pageObjectNumber = pageObjectStart + index * 2
    const contentObjectNumber = pageObjectNumber + 1

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    )
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const downloadTablePdf = ({ title, filename, columns, rows }) => {
  const content = []
  const tableWidth = CONTENT_WIDTH
  const headerTop = 96
  const rowHeight = 24
  const titleY = PAGE_HEIGHT - 48
  const generatedAtY = PAGE_HEIGHT - 66

  content.push('0 G')
  content.push(pdfText(title, PAGE_MARGIN, titleY, 18, 'F2'))
  content.push(pdfText(`Generated: ${new Date().toLocaleString('en-US')}`, PAGE_MARGIN, generatedAtY, 9, 'F1'))

  let currentTop = headerTop

  const drawHeader = () => {
    const headerBottom = PAGE_HEIGHT - currentTop - rowHeight
    content.push('0.94 0.96 1 rg')
    content.push(pdfRectFill(PAGE_MARGIN, headerBottom, tableWidth, rowHeight))
    content.push('0 G')

    let x = PAGE_MARGIN
    columns.forEach((column) => {
      const width = Math.round(tableWidth * column.width)
      content.push(pdfLine(x, headerBottom, x + width, headerBottom))
      content.push(pdfLine(x, headerBottom + rowHeight, x + width, headerBottom + rowHeight))
      content.push(pdfLine(x, headerBottom, x, headerBottom + rowHeight))
      content.push(pdfText(truncateText(column.label, Math.max(8, Math.floor(width / 6))), x + 6, headerBottom + 8, 9, 'F2'))
      x += width
    })
    content.push(pdfLine(PAGE_MARGIN + tableWidth, headerBottom, PAGE_MARGIN + tableWidth, headerBottom + rowHeight))
    currentTop += rowHeight
  }

  drawHeader()

  rows.forEach((row) => {
    if (currentTop + rowHeight > PAGE_HEIGHT - PAGE_MARGIN) return

    const rowBottom = PAGE_HEIGHT - currentTop - rowHeight
    let x = PAGE_MARGIN

    columns.forEach((column) => {
      const width = Math.round(tableWidth * column.width)
      content.push(pdfLine(x, rowBottom, x + width, rowBottom))
      content.push(pdfLine(x, rowBottom + rowHeight, x + width, rowBottom + rowHeight))
      content.push(pdfLine(x, rowBottom, x, rowBottom + rowHeight))
      content.push(pdfText(truncateText(row[column.key], Math.max(8, Math.floor(width / 6))), x + 6, rowBottom + 8, 9, 'F1'))
      x += width
    })

    content.push(pdfLine(PAGE_MARGIN + tableWidth, rowBottom, PAGE_MARGIN + tableWidth, rowBottom + rowHeight))
    currentTop += rowHeight
  })

  triggerDownload(buildPdf([content.join('\n')]), filename)
}

export const downloadContractorsPdf = ({ title, filename, contractors, customerNameById = {} }) => {
  const pages = [[]]
  let currentPageIndex = 0
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN

  const currentPage = () => pages[currentPageIndex]
  const lineGap = 14

  const addPage = () => {
    pages.push([])
    currentPageIndex += 1
    cursorY = PAGE_HEIGHT - PAGE_MARGIN
  }

  const ensureSpace = (height) => {
    if (cursorY - height < PAGE_MARGIN) addPage()
  }

  const writeText = (text, x, y, size = 10, font = 'F1') => {
    currentPage().push(pdfText(text, x, y, size, font))
  }

  const drawContractTableHeader = () => {
    const headerHeight = 20
    ensureSpace(headerHeight + 8)
    const widths = [0.2, 0.24, 0.14, 0.14, 0.11, 0.11, 0.06]
    const labels = ['REF / PO', 'CUSTOMER', 'START', 'END', 'PAY', 'BILL', 'STATUS']
    const bottom = cursorY - headerHeight

    currentPage().push('0.95 0.97 1 rg')
    currentPage().push(pdfRectFill(PAGE_MARGIN, bottom, CONTENT_WIDTH, headerHeight))
    currentPage().push('0 G')

    let x = PAGE_MARGIN
    labels.forEach((label, index) => {
      const width = Math.round(CONTENT_WIDTH * widths[index])
      currentPage().push(pdfLine(x, bottom, x + width, bottom))
      currentPage().push(pdfLine(x, bottom + headerHeight, x + width, bottom + headerHeight))
      currentPage().push(pdfLine(x, bottom, x, bottom + headerHeight))
      writeText(label, x + 5, bottom + 6, 8, 'F2')
      x += width
    })
    currentPage().push(pdfLine(PAGE_MARGIN + CONTENT_WIDTH, bottom, PAGE_MARGIN + CONTENT_WIDTH, bottom + headerHeight))
    cursorY -= headerHeight
    return widths
  }

  currentPage().push('0 G')
  writeText(title, PAGE_MARGIN, cursorY, 18, 'F2')
  cursorY -= 18
  writeText(`Generated: ${new Date().toLocaleString('en-US')}`, PAGE_MARGIN, cursorY, 9, 'F1')
  cursorY -= 26

  contractors.forEach((contractor, contractorIndex) => {
    const sectionStartHeight = 112
    ensureSpace(sectionStartHeight)

    const bandHeight = 22
    const bandBottom = cursorY - bandHeight + 4
    currentPage().push('0.91 0.94 1 rg')
    currentPage().push(pdfRectFill(PAGE_MARGIN, bandBottom, CONTENT_WIDTH, bandHeight))
    currentPage().push('0 G')
    writeText(`${contractor.name || '-'} (${contractor.contractorId || 'No ID'})`, PAGE_MARGIN + 8, bandBottom + 7, 12, 'F2')
    cursorY -= 28

    const leftX = PAGE_MARGIN
    const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2 + 8

    writeText('EMAIL', leftX, cursorY, 8, 'F2')
    writeText(truncateText(contractor.email || '-', 38), leftX, cursorY - 12, 10, 'F1')
    writeText('PHONE', rightX, cursorY, 8, 'F2')
    writeText(truncateText(contractor.phoneNumber || '-', 28), rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('LOCATION', leftX, cursorY, 8, 'F2')
    writeText(truncateText(contractor.currentLocation || '-', 24), leftX, cursorY - 12, 10, 'F1')
    writeText('NOTICE PERIOD', rightX, cursorY, 8, 'F2')
    writeText(`${contractor.noticePeriodDays ?? 0} days`, rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('CUSTOMER MANAGER', leftX, cursorY, 8, 'F2')
    writeText(truncateText(contractor.customerManager || '-', 28), leftX, cursorY - 12, 10, 'F1')
    writeText('MANAGER EMAIL', rightX, cursorY, 8, 'F2')
    writeText(truncateText(contractor.customerManagerEmail || '-', 32), rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    const addressLines = wrapText(contractor.address || '-', 82).slice(0, 2)
    writeText('ADDRESS', leftX, cursorY, 8, 'F2')
    addressLines.forEach((line, index) => {
      writeText(line, leftX, cursorY - 12 - index * 11, 10, 'F1')
    })
    cursorY -= 12 + addressLines.length * 11 + 8

    const remarksLines = wrapText(contractor.remarks || 'No remarks', 82).slice(0, 2)
    writeText('REMARKS', leftX, cursorY, 8, 'F2')
    remarksLines.forEach((line, index) => {
      writeText(line, leftX, cursorY - 12 - index * 11, 10, 'F1')
    })
    cursorY -= 12 + remarksLines.length * 11 + 12

    writeText('CONTRACTS', PAGE_MARGIN, cursorY, 9, 'F2')
    cursorY -= 12

    if (!contractor.contracts?.length) {
      ensureSpace(18)
      writeText('No contracts assigned.', PAGE_MARGIN, cursorY, 10, 'F1')
      cursorY -= 22
    } else {
      const widths = drawContractTableHeader()
      contractor.contracts.forEach((contract) => {
        const rowHeight = 20
        ensureSpace(rowHeight + 6)
        if (cursorY === PAGE_HEIGHT - PAGE_MARGIN) {
          writeText(`${contractor.name || '-'} (${contractor.contractorId || 'No ID'})`, PAGE_MARGIN, cursorY, 11, 'F2')
          cursorY -= 18
          drawContractTableHeader()
        }

        const bottom = cursorY - rowHeight
        const values = [
          contract.poAllocation || (contract.id ? `Contract #${contract.id}` : '-'),
          contract.customerId ? customerNameById[String(contract.customerId)] || `Customer #${contract.customerId}` : 'Not assigned',
          contract.startDate || '-',
          contract.endDate || '-',
          contract.payRate != null ? String(contract.payRate) : '-',
          contract.billRate != null ? String(contract.billRate) : '-',
          contract.status || '-',
        ]

        let x = PAGE_MARGIN
        values.forEach((value, index) => {
          const width = Math.round(CONTENT_WIDTH * widths[index])
          currentPage().push(pdfLine(x, bottom, x + width, bottom))
          currentPage().push(pdfLine(x, bottom + rowHeight, x + width, bottom + rowHeight))
          currentPage().push(pdfLine(x, bottom, x, bottom + rowHeight))
          writeText(truncateText(value, Math.max(7, Math.floor(width / 5.8))), x + 5, bottom + 6, 8.5, 'F1')
          x += width
        })
        currentPage().push(pdfLine(PAGE_MARGIN + CONTENT_WIDTH, bottom, PAGE_MARGIN + CONTENT_WIDTH, bottom + rowHeight))
        cursorY -= rowHeight
      })
      cursorY -= 10
    }

    if (contractorIndex < contractors.length - 1) {
      ensureSpace(14)
      currentPage().push(pdfLine(PAGE_MARGIN, cursorY, PAGE_MARGIN + CONTENT_WIDTH, cursorY))
      cursorY -= 18
    }
  })

  triggerDownload(buildPdf(pages.map((page) => page.join('\n'))), filename)
}

export const downloadPOsPdf = ({ title, filename, pos, customerNameById = {} }) => {
  const pages = [[]]
  let currentPageIndex = 0
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN

  const currentPage = () => pages[currentPageIndex]

  const addPage = () => {
    pages.push([])
    currentPageIndex += 1
    cursorY = PAGE_HEIGHT - PAGE_MARGIN
  }

  const ensureSpace = (height) => {
    if (cursorY - height < PAGE_MARGIN) addPage()
  }

  const writeText = (text, x, y, size = 10, font = 'F1') => {
    currentPage().push(pdfText(text, x, y, size, font))
  }

  currentPage().push('0 G')
  writeText(title, PAGE_MARGIN, cursorY, 18, 'F2')
  cursorY -= 18
  writeText(`Generated: ${new Date().toLocaleString('en-US')}`, PAGE_MARGIN, cursorY, 9, 'F1')
  cursorY -= 26

  pos.forEach((po, index) => {
    const customerName = po.customerId ? customerNameById[String(po.customerId)] || `Customer #${po.customerId}` : '-'
    const sectionHeight = 156
    ensureSpace(sectionHeight)

    const bandHeight = 22
    const bandBottom = cursorY - bandHeight + 4
    currentPage().push('0.91 0.94 1 rg')
    currentPage().push(pdfRectFill(PAGE_MARGIN, bandBottom, CONTENT_WIDTH, bandHeight))
    currentPage().push('0 G')
    writeText(`${po.poNumber || '-'}${customerName !== '-' ? ` - ${truncateText(customerName, 48)}` : ''}`, PAGE_MARGIN + 8, bandBottom + 7, 12, 'F2')
    cursorY -= 28

    const leftX = PAGE_MARGIN
    const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2 + 8

    writeText('CUSTOMER', leftX, cursorY, 8, 'F2')
    writeText(truncateText(customerName, 34), leftX, cursorY - 12, 10, 'F1')
    writeText('PO DATE', rightX, cursorY, 8, 'F2')
    writeText(po.poDate || '-', rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('START DATE', leftX, cursorY, 8, 'F2')
    writeText(po.startDate || '-', leftX, cursorY - 12, 10, 'F1')
    writeText('END DATE', rightX, cursorY, 8, 'F2')
    writeText(po.endDate || '-', rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('PO VALUE', leftX, cursorY, 8, 'F2')
    writeText(po.poValue != null ? String(po.poValue) : '-', leftX, cursorY - 12, 10, 'F1')
    writeText('CURRENCY', rightX, cursorY, 8, 'F2')
    writeText(po.currency || '-', rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('PAYMENT TERMS', leftX, cursorY, 8, 'F2')
    writeText(po.paymentTermsDays != null ? `${po.paymentTermsDays} days` : '-', leftX, cursorY - 12, 10, 'F1')
    writeText('RESOURCES', rightX, cursorY, 8, 'F2')
    writeText(po.numberOfResources != null ? String(po.numberOfResources) : '-', rightX, cursorY - 12, 10, 'F1')
    cursorY -= 30

    writeText('SHARED WITH', leftX, cursorY, 8, 'F2')
    writeText(truncateText(po.sharedWith || '-', 34), leftX, cursorY - 12, 10, 'F1')
    cursorY -= 24

    const remarkLines = wrapText(po.remark || 'No remarks', 82).slice(0, 3)
    writeText('REMARK', leftX, cursorY, 8, 'F2')
    remarkLines.forEach((line, lineIndex) => {
      writeText(line, leftX, cursorY - 12 - lineIndex * 11, 10, 'F1')
    })
    cursorY -= 12 + remarkLines.length * 11 + 10

    if (index < pos.length - 1) {
      ensureSpace(14)
      currentPage().push(pdfLine(PAGE_MARGIN, cursorY, PAGE_MARGIN + CONTENT_WIDTH, cursorY))
      cursorY -= 18
    }
  })

  triggerDownload(buildPdf(pages.map((page) => page.join('\n'))), filename)
}
