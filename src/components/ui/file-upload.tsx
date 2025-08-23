import * as React from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  className?: string
  currentFile?: File | null
  previewUrl?: string | null
  placeholder?: string
  aspectRatio?: number
  maxSizeText?: string
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    onFileSelect, 
    accept = "image/*", 
    className, 
    currentFile, 
    previewUrl, 
    placeholder = "Click to upload image",
    aspectRatio = 1,
    maxSizeText = "Maximum file size: 10MB"
  }, ref) => {
    const [preview, setPreview] = React.useState<string | null>(previewUrl || null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (previewUrl) {
        setPreview(previewUrl)
      }
    }, [previewUrl])

    // Handle currentFile changes to maintain preview across navigation
    React.useEffect(() => {
      if (currentFile) {
        const objectUrl = URL.createObjectURL(currentFile)
        setPreview(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
      } else {
        setPreview(null)
      }
    }, [currentFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        // Create preview URL
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
        onFileSelect(file)
      }
    }

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      setPreview(null)
      onFileSelect(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    const handleClick = () => {
      fileInputRef.current?.click()
    }

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      }
    }, [preview])

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer group"
          style={{ aspectRatio }}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                    className="bg-white/90 text-black hover:bg-white"
                  >
                    Change
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    className="bg-red-500/90 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center">
              <div>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  {placeholder}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {maxSizeText}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"