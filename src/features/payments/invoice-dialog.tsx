import { Download, Printer } from 'lucide-react'

import { Button, Modal } from '../../shared/ui'
import type { Payment } from '../club/domain/model'
import { downloadInvoice, invoiceMarkup } from './invoice-document'
import { invoiceStyles } from './invoice-styles'

export function InvoiceDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Tu comprobante" wide>
      <style>{invoiceStyles}</style>
      {/* Only our escaped, script-free template is accepted here; preview and download stay identical. */}
      <div
        data-invoice-document
        className="club-invoice"
        dangerouslySetInnerHTML={{ __html: invoiceMarkup(payment) }}
      />
      <div className="mt-6 flex flex-wrap gap-2.5 [&>button]:flex-1">
        <Button variant="secondary" onClick={() => downloadInvoice(payment)}>
          <Download size={17} />
          Descargar HTML
        </Button>
        <Button onClick={() => window.print()}>
          <Printer size={17} />
          Imprimir / PDF
        </Button>
      </div>
    </Modal>
  )
}
