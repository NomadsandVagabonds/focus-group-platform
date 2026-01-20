// File Upload Question Component (LimeSurvey Type |)
// Allows single or multiple file uploads with preview and progress
'use client';

import { useState, useRef, useCallback } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string; // For preview or download
    thumbnail?: string; // For image previews
    progress: number; // 0-100
    status: 'uploading' | 'complete' | 'error';
    error?: string;
}

interface FileUploadQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
    responseId?: string; // Required for server-side uploads
}

// Helper to generate unique IDs
function generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper to check if file is an image
function isImageFile(type: string): boolean {
    return type.startsWith('image/');
}

// Helper to get file extension
function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

// Helper to get file icon based on type
function getFileIcon(type: string, extension: string): string {
    if (isImageFile(type)) return '🖼️';
    if (type === 'application/pdf' || extension === 'pdf') return '📄';
    if (type.includes('word') || ['doc', 'docx'].includes(extension)) return '📝';
    if (type.includes('excel') || ['xls', 'xlsx'].includes(extension)) return '📊';
    if (type.includes('powerpoint') || ['ppt', 'pptx'].includes(extension)) return '📽️';
    if (type.includes('zip') || ['zip', 'rar', '7z'].includes(extension)) return '📦';
    if (type.includes('video') || ['mp4', 'avi', 'mov'].includes(extension)) return '🎬';
    if (type.includes('audio') || ['mp3', 'wav', 'ogg'].includes(extension)) return '🎵';
    return '📎';
}

export default function FileUploadQuestion({ question, responseData, onAnswer, responseId }: FileUploadQuestionProps) {
    const settings = question.settings || {};
    const allowedTypes = settings.allowed_file_types || [];
    const maxFileSize = settings.max_file_size || 10; // Default 10 MB
    const maxFiles = settings.max_files || 1;
    const isMultiple = maxFiles > 1;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current files from responseData or initialize empty array
    const currentFiles: UploadedFile[] = responseData.get(question.code) || [];
    const [files, setFiles] = useState<UploadedFile[]>(currentFiles);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate accept string for file input
    const acceptString = allowedTypes.length > 0
        ? allowedTypes.map(ext => `.${ext}`).join(',')
        : '*';

    // Validate file
    const validateFile = useCallback((file: File): string | null => {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File "${file.name}" exceeds maximum size of ${maxFileSize} MB`;
        }

        // Check file type if restrictions exist
        if (allowedTypes.length > 0) {
            const extension = getFileExtension(file.name);
            if (!allowedTypes.includes(extension)) {
                return `File type ".${extension}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
            }
        }

        return null;
    }, [allowedTypes, maxFileSize]);

    // Upload file to server using the upload API
    const uploadFile = useCallback(async (file: File, responseId: string): Promise<UploadedFile> => {
        const id = generateId();
        const newFile: UploadedFile = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'uploading',
        };

        // Create thumbnail for images
        if (isImageFile(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newFile.thumbnail = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('response_id', responseId);
            formData.append('question_id', question.id);
            if (allowedTypes.length > 0) {
                formData.append('allowed_types', allowedTypes.join(','));
            }
            formData.append('max_size', String(maxFileSize));

            // Show initial progress
            newFile.progress = 10;
            setFiles(prev => prev.map(f => f.id === id ? { ...newFile } : f));

            // Upload to API
            const response = await fetch('/api/survey/upload', {
                method: 'POST',
                body: formData,
            });

            // Update progress
            newFile.progress = 80;
            setFiles(prev => prev.map(f => f.id === id ? { ...newFile } : f));

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            // Update with server data
            newFile.id = result.file.id;
            newFile.url = result.file.url;
            newFile.progress = 100;
            newFile.status = 'complete';

            return newFile;
        } catch (error: any) {
            newFile.status = 'error';
            newFile.error = error.message || 'Upload failed';
            return newFile;
        }
    }, [question.id, allowedTypes, maxFileSize]);

    // Handle file selection
    const handleFiles = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        // Check if responseId is available for server uploads
        if (!responseId) {
            setError('Cannot upload files: Survey response not initialized');
            return;
        }

        setError(null);

        const filesToAdd = Array.from(selectedFiles);
        const availableSlots = maxFiles - files.length;

        if (filesToAdd.length > availableSlots) {
            if (availableSlots === 0) {
                setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed. Remove a file to add a new one.`);
                return;
            }
            setError(`Only ${availableSlots} more file${availableSlots > 1 ? 's' : ''} can be added. First ${availableSlots} selected.`);
            filesToAdd.splice(availableSlots);
        }

        // Validate all files
        for (const file of filesToAdd) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // Start uploading
        const newFiles: UploadedFile[] = filesToAdd.map(file => ({
            id: generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'uploading' as const,
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Upload each file to server
        const uploadedFiles = await Promise.all(
            filesToAdd.map(async (file, index) => {
                const uploaded = await uploadFile(file, responseId);
                // Update with the actual file data
                return { ...newFiles[index], ...uploaded };
            })
        );

        setFiles(prev => {
            const updated = [...prev];
            uploadedFiles.forEach(uploaded => {
                const idx = updated.findIndex(f => f.id === uploaded.id);
                if (idx !== -1) {
                    updated[idx] = uploaded;
                }
            });
            // Update response data
            onAnswer(question.code, updated);
            return updated;
        });
    }, [files.length, maxFiles, validateFile, uploadFile, onAnswer, question.code]);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    // Handle file input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Remove file (also deletes from server)
    const removeFile = async (fileId: string) => {
        const fileToRemove = files.find(f => f.id === fileId);

        // Optimistically remove from UI
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== fileId);
            onAnswer(question.code, updated.length > 0 ? updated : undefined);
            return updated;
        });
        setError(null);

        // Delete from server if file has a URL (was uploaded)
        if (fileToRemove?.url) {
            try {
                await fetch(`/api/survey/upload?id=${fileId}&path=${encodeURIComponent(fileToRemove.url)}`, {
                    method: 'DELETE',
                });
            } catch (err) {
                console.error('Error deleting file from server:', err);
            }
        }
    };

    // Open file picker
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const canAddMore = files.length < maxFiles;

    return (
        <div className="file-upload-question">
            {/* Drop zone */}
            {canAddMore && (
                <div
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFilePicker}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptString}
                        multiple={isMultiple}
                        onChange={handleInputChange}
                        className="file-input"
                    />
                    <div className="drop-zone-content">
                        <div className="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="drop-zone-text">
                            <span className="drop-zone-link">Click to upload</span> or drag and drop
                        </p>
                        <p className="drop-zone-hint">
                            {allowedTypes.length > 0
                                ? `Allowed: ${allowedTypes.join(', ').toUpperCase()}`
                                : 'All file types allowed'}
                            {' | Max size: '}{maxFileSize} MB
                            {isMultiple && ` | Max files: ${maxFiles}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="file-list">
                    {files.map(file => (
                        <div key={file.id} className="file-item">
                            {/* Thumbnail or icon */}
                            <div className="file-preview">
                                {file.thumbnail ? (
                                    <img src={file.thumbnail} alt={file.name} className="file-thumbnail" />
                                ) : (
                                    <span className="file-icon">
                                        {getFileIcon(file.type, getFileExtension(file.name))}
                                    </span>
                                )}
                            </div>

                            {/* File info */}
                            <div className="file-info">
                                <div className="file-name">{file.name}</div>
                                <div className="file-size">{formatFileSize(file.size)}</div>

                                {/* Progress bar */}
                                {file.status === 'uploading' && (
                                    <div className="progress-container">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Status */}
                                {file.status === 'complete' && (
                                    <div className="file-status complete">Uploaded</div>
                                )}
                                {file.status === 'error' && (
                                    <div className="file-status error">{file.error || 'Upload failed'}</div>
                                )}
                            </div>

                            {/* Remove button */}
                            <button
                                type="button"
                                className="remove-button"
                                onClick={() => removeFile(file.id)}
                                aria-label={`Remove ${file.name}`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* File count indicator for multiple uploads */}
            {isMultiple && (
                <div className="file-count">
                    {files.length} of {maxFiles} file{maxFiles > 1 ? 's' : ''} uploaded
                </div>
            )}

            <style jsx>{`
                .file-upload-question {
                    margin: 1rem 0;
                }

                .drop-zone {
                    border: 2px dashed #e0ddd8;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: #fafaf9;
                }

                .drop-zone:hover {
                    border-color: #c94a4a;
                    background: #f5f3ef;
                }

                .drop-zone.active {
                    border-color: #c94a4a;
                    background: rgba(201, 74, 74, 0.05);
                    border-style: solid;
                }

                .file-input {
                    display: none;
                }

                .drop-zone-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }

                .upload-icon {
                    color: #999;
                    transition: color 0.2s;
                }

                .drop-zone:hover .upload-icon,
                .drop-zone.active .upload-icon {
                    color: #c94a4a;
                }

                .drop-zone-text {
                    font-size: 1rem;
                    color: #333;
                    margin: 0;
                }

                .drop-zone-link {
                    color: #c94a4a;
                    font-weight: 500;
                }

                .drop-zone-hint {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0;
                }

                .error-message {
                    margin-top: 1rem;
                    padding: 0.75rem 1rem;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 4px;
                    color: #b91c1c;
                    font-size: 0.875rem;
                }

                .file-list {
                    margin-top: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .file-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 1rem;
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    transition: border-color 0.2s;
                }

                .file-item:hover {
                    border-color: #c94a4a;
                }

                .file-preview {
                    width: 48px;
                    height: 48px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f5f3ef;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .file-thumbnail {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .file-icon {
                    font-size: 1.5rem;
                }

                .file-info {
                    flex: 1;
                    min-width: 0;
                }

                .file-name {
                    font-size: 0.95rem;
                    color: #1a1d24;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .file-size {
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 0.125rem;
                }

                .progress-container {
                    margin-top: 0.5rem;
                    height: 4px;
                    background: #e0ddd8;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-bar {
                    height: 100%;
                    background: #c94a4a;
                    transition: width 0.1s ease;
                }

                .file-status {
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }

                .file-status.complete {
                    color: #15803d;
                }

                .file-status.error {
                    color: #b91c1c;
                }

                .remove-button {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    color: #999;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .remove-button:hover {
                    background: #fef2f2;
                    color: #c94a4a;
                }

                .file-count {
                    margin-top: 0.75rem;
                    font-size: 0.875rem;
                    color: #666;
                    text-align: right;
                }

                @media (max-width: 768px) {
                    .drop-zone {
                        padding: 1.5rem 1rem;
                    }

                    .drop-zone-text {
                        font-size: 0.95rem;
                    }

                    .drop-zone-hint {
                        font-size: 0.8rem;
                    }

                    .file-item {
                        padding: 0.5rem 0.75rem;
                    }

                    .file-preview {
                        width: 40px;
                        height: 40px;
                    }

                    .file-name {
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
}
