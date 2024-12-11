'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useRef } from 'react';
import useResizeObserver from '@react-hook/resize-observer';
import { twJoin } from 'tailwind-merge';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
).toString();

type ClientPDFViewerProps = {
    url: string; // URL to the PDF file
};

const ClientPDFViewer: React.FC<ClientPDFViewerProps> = ({ url }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [width, setWidth] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Resize observer to make PDF responsive
    useResizeObserver(containerRef, (entry) => {
        const { width } = entry?.contentRect;
        setWidth(width);
    });

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    // Navigation functions
    const previousPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    };

    const nextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages));
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Navigation controls */}
            <div className="flex gap-4 my-4 items-center">
                <button
                    onClick={previousPage}
                    disabled={pageNumber <= 1}
                    className={twJoin(
                        "px-4 py-2 rounded-lg",
                        "bg-blue-500 text-white",
                        "disabled:bg-gray-300 disabled:cursor-not-allowed",
                        "transition-colors duration-200"
                    )}
                >
                    Previous
                </button>
                <span>
                    Page {pageNumber} of {numPages}
                </span>
                <button
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                    className={twJoin(
                        "px-4 py-2 rounded-lg",
                        "bg-blue-500 text-white",
                        "disabled:bg-gray-300 disabled:cursor-not-allowed",
                        "transition-colors duration-200"
                    )}
                >
                    Next
                </button>
            </div>

            {/* PDF Viewer */}
            <div ref={containerRef} className="w-full max-w-4xl">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex justify-center items-center h-[500px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    }
                    error={
                        <div className="flex justify-center items-center h-[500px] text-red-500">
                            Failed to load PDF
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        width={width || undefined}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={
                            <div className="flex justify-center items-center h-[500px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        }
                    />
                </Document>
            </div>
        </div>
    );
};

export default ClientPDFViewer;