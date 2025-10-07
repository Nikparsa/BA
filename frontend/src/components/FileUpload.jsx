import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

export function FileUpload({ onFileSelect, disabled = false, accept = { 'application/zip': ['.zip'] } }) {
  const [uploadedFile, setUploadedFile] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled
  })

  const removeFile = () => {
    setUploadedFile(null)
    onFileSelect(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive && 'border-blue-400 bg-blue-50',
          uploadedFile && 'border-green-400 bg-green-50',
          !isDragActive && !uploadedFile && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {uploadedFile ? (
          <div className="space-y-2">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <div className="flex items-center justify-center space-x-2">
              <File className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{uploadedFile.name}</span>
              <span className="text-xs text-gray-500">({formatFileSize(uploadedFile.size)})</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <div>
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">ZIP file containing your solution.py</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((error) => (
                <p key={error.code}>{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
