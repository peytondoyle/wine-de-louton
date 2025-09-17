import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { VisuallyHidden } from "./VisuallyHidden"
import { useScrollLock } from "../../hooks/useScrollLock"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    onClose?: () => void
  }
>(({ className, onClose, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:transition-opacity motion-reduce:data-[state=open]:opacity-100 motion-reduce:data-[state=closed]:opacity-0",
      className
    )}
    style={{ 
      touchAction: 'none',
      overscrollBehavior: 'contain'
    }}
    onClick={onClose}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: React.ReactNode
    description?: React.ReactNode
    hideTitleVisually?: boolean
    lockZoom?: boolean
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    actions?: React.ReactNode
    useStickyLayout?: boolean
  }
>(({ className, children, title, description, hideTitleVisually = false, lockZoom = true, isOpen: propIsOpen, onOpenChange, actions, useStickyLayout = false, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const ariaLiveRef = React.useRef<HTMLDivElement>(null)
  const originalViewportRef = React.useRef<string | null>(null)
  const viewportMetaRef = React.useRef<HTMLMetaElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Determine if dialog is actually open
  const actuallyOpen = propIsOpen !== undefined ? propIsOpen : isOpen

  // Lock background scroll when dialog is open
  useScrollLock(actuallyOpen)

  // Viewport meta management for zoom locking
  React.useEffect(() => {
    if (!lockZoom) return

    if (isOpen) {
      // Store original viewport content
      const existingViewport = document.querySelector('meta[name="viewport"]')
      if (existingViewport) {
        originalViewportRef.current = existingViewport.getAttribute('content')
      }

      // Inject zoom-locked viewport meta
      const viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      viewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1'
      document.head.appendChild(viewportMeta)
      viewportMetaRef.current = viewportMeta
    } else {
      // Restore original viewport meta
      if (viewportMetaRef.current) {
        document.head.removeChild(viewportMetaRef.current)
        viewportMetaRef.current = null
      }

      if (originalViewportRef.current !== null) {
        const existingViewport = document.querySelector('meta[name="viewport"]')
        if (existingViewport) {
          existingViewport.setAttribute('content', originalViewportRef.current)
        }
        originalViewportRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (viewportMetaRef.current) {
        document.head.removeChild(viewportMetaRef.current)
        viewportMetaRef.current = null
      }
      if (originalViewportRef.current !== null) {
        const existingViewport = document.querySelector('meta[name="viewport"]')
        if (existingViewport) {
          existingViewport.setAttribute('content', originalViewportRef.current)
        }
        originalViewportRef.current = null
      }
    }
  }, [isOpen, lockZoom])


  // Manage background inert state to block stray clicks and AT
  React.useEffect(() => {
    const setInertOnSiblings = () => {
      try {
        const appRoot = document.getElementById('root')
        if (!appRoot) {
          console.warn('App root not found for inert management')
          return
        }

        const siblings = Array.from(appRoot.parentNode?.children || [])
        
        siblings.forEach(sibling => {
          if (sibling !== appRoot) {
            // Set inert attribute (modern browsers)
            sibling.setAttribute('inert', 'true')
            // Fallback for older browsers
            sibling.setAttribute('aria-hidden', 'true')
          }
        })
      } catch (error) {
        // Fail safely on older browsers
        console.warn('Failed to set inert attributes:', error)
      }
    }

    const removeInertFromSiblings = () => {
      try {
        const appRoot = document.getElementById('root')
        if (!appRoot) return

        const siblings = Array.from(appRoot.parentNode?.children || [])
        siblings.forEach(sibling => {
          if (sibling !== appRoot) {
            sibling.removeAttribute('inert')
            sibling.removeAttribute('aria-hidden')
          }
        })
      } catch (error) {
        // Fail safely on older browsers
        console.warn('Failed to remove inert attributes:', error)
      }
    }

    if (actuallyOpen) {
      setInertOnSiblings()
    } else {
      removeInertFromSiblings()
    }

    // Cleanup on unmount
    return () => {
      removeInertFromSiblings()
    }
  }, [isOpen, propIsOpen])

  // Announce dialog opening/closing
  React.useEffect(() => {
    if (isOpen && title && ariaLiveRef.current) {
      ariaLiveRef.current.textContent = `Opened dialog: ${title}`
    } else if (!isOpen && ariaLiveRef.current) {
      ariaLiveRef.current.textContent = ''
    }
  }, [isOpen, title])

  return (
    <DialogPortal>
      <DialogOverlay onClose={() => onOpenChange?.(false)} />
      {/* ARIA live region for dialog announcements */}
      <div
        ref={ariaLiveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <DialogPrimitive.Content
        ref={(node) => {
          contentRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={cn(
          "fixed inset-0 z-50 flex flex-col pointer-events-auto outline-none",
          "w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] min-h-0 overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "motion-reduce:transition-opacity motion-reduce:data-[state=open]:opacity-100 motion-reduce:data-[state=closed]:opacity-0",
          "motion-reduce:data-[state=open]:scale-100 motion-reduce:data-[state=closed]:scale-95",
          className
        )}
        style={{
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        data-dialog-content=""
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          // Allow overlay click to close; but don't treat scrollbar/thumb drags as outside
          if ((e.target as HTMLElement)?.closest('[data-dialog-content]')) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Only allow overlay click to close. Keyboard focus moves okay.
          const el = e.target as HTMLElement | null;
          if (!el) return;
          // If click started within the content subtree, do not close.
          if (el.closest('[data-dialog-content]')) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          // Prevent auto-focus to allow custom focus management
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => onOpenChange?.(false)}
        aria-modal="true"
        role="dialog"
        data-state={isOpen ? 'open' : 'closed'}
        onAnimationStart={() => setIsOpen(true)}
        onAnimationEnd={() => setIsOpen(false)}
        {...props}
      >
        {/* Title and Description for ARIA - must render before children */}
        {title && (
          hideTitleVisually ? (
            <VisuallyHidden>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            </VisuallyHidden>
          ) : (
            <DialogPrimitive.Title asChild>
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h2>
            </DialogPrimitive.Title>
          )
        )}
        {description && (
          <DialogPrimitive.Description asChild>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </DialogPrimitive.Description>
        )}

        {useStickyLayout ? (
          <>
            {title && !hideTitleVisually && (
              <header className="shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b px-4 py-3">
                <DialogPrimitive.Title asChild>
                  <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </h2>
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description asChild>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </DialogPrimitive.Description>
                )}
              </header>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {children}
            </div>
            {actions && (
              <footer className="shrink-0 sticky bottom-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-4 py-3">
                {actions}
              </footer>
            )}
          </>
        ) : (
          <>
            <header className="shrink-0">
              {title && !hideTitleVisually && (
                <div className="px-4 py-3 border-b">
                  <DialogPrimitive.Title asChild>
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                      {title}
                    </h2>
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description asChild>
                      <p className="text-sm text-muted-foreground mt-1">
                        {description}
                      </p>
                    </DialogPrimitive.Description>
                  )}
                </div>
              )}
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {children}
            </div>
            {actions && (
              <footer className="shrink-0 px-4 py-3 border-t">
                {actions}
              </footer>
            )}
          </>
        )}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Export types for callers
export type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  title?: React.ReactNode
  description?: React.ReactNode
  hideTitleVisually?: boolean
  lockZoom?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  actions?: React.ReactNode
  useStickyLayout?: boolean
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
