import { useState } from 'react'
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog'
import { TextArea } from './ui/TextArea'
import { Label } from './ui/Label'
import { importWinesFromCsv, generateSampleCsv } from '../data/csv-import'
import { toast } from 'react-hot-toast'

interface CsvImportButtonProps {
  onImportComplete: () => void
}

export function CsvImportButton({ onImportComplete }: CsvImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error('Please paste CSV content')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importWinesFromCsv(csvContent)
      setImportResult(result)
      
      if (result.success > 0) {
        toast.success(`Imported ${result.success} wines successfully`)
        onImportComplete()
      }
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} wines failed to import`)
      }
    } catch (error) {
      console.error('CSV import error:', error)
      toast.error('Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleLoadSample = () => {
    setCsvContent(generateSampleCsv())
  }

  const handleClose = () => {
    setIsOpen(false)
    setCsvContent('')
    setImportResult(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs"
      >
        <Upload className="h-3 w-3 mr-1" />
        CSV Import
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="
          fixed left-1/2 top-1/2 z-50 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2
          rounded-2xl border border-neutral-200/70
          bg-white supports-[backdrop-filter]:bg-white/95
          shadow-xl outline-none max-h-[90vh] overflow-y-auto
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
        ">
          <DialogHeader>
            <DialogTitle>CSV Import (DEV)</DialogTitle>
            <DialogDescription>
              Import multiple wines from CSV. Only producer is required. 
              AI enrichment will be triggered automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                disabled={isImporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Load Sample CSV
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-content">CSV Content</Label>
              <TextArea
                id="csv-content"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste CSV content here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Successfully imported {importResult.success} wines
                  </span>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        {importResult.errors.length} errors:
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto text-xs text-red-600 bg-red-50 p-2 rounded">
                      {importResult.errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || !csvContent.trim()}
              >
                {isImporting ? 'Importing...' : 'Import Wines'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
