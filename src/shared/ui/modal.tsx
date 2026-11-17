import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createContext, useContext, type ReactNode, type RefObject } from 'react'

import { cn } from '../cn'
import { IconButton } from './button'

const ModalContext = createContext(false)
export function useInModal() {
  return useContext(ModalContext)
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
  mobileSheet = false,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
  mobileSheet?: boolean
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#10261c]/70 backdrop-blur-[5px]" />
        <Dialog.Content
          data-modal
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault()
              returnFocusRef.current.focus()
            }
          }}
          {...(!description && { 'aria-describedby': undefined })}
          className={cn(
            'bg-surface desktop:w-[calc(100%_-_32px)] desktop:rounded-[20px] desktop:p-5 fixed top-1/2 left-1/2 z-[101] max-h-[min(90dvh,900px)] w-[calc(100%_-_24px)] max-w-[500px] -translate-1/2 overflow-y-auto overscroll-y-contain rounded-[18px] p-4 shadow-[0_24px_120px_#061c193b] outline-none',
            wide && 'max-w-[660px]',
            mobileSheet &&
              'max-desktop:top-auto max-desktop:bottom-0 max-desktop:left-0 max-desktop:max-h-[94dvh] max-desktop:w-full max-desktop:max-w-none max-desktop:translate-none max-desktop:rounded-b-none max-desktop:rounded-t-[22px] max-desktop:px-4 max-desktop:pb-[max(16px,env(safe-area-inset-bottom))]',
          )}
        >
          <div data-modal-heading className="mb-3 flex items-start justify-between gap-2">
            <div>
              <Dialog.Title className="text-base leading-snug font-semibold tracking-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-muted mt-1 text-[13px] font-normal">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <IconButton label="Cerrar" onPress={onClose}>
              <X size={20} />
            </IconButton>
          </div>
          <ModalContext.Provider value={true}>{children}</ModalContext.Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
