'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useFullPage } from './FullPageProvider';
import { convertPDF, loadLocalPDF } from '@/lib/actions';
import { MAXIMAL_NUMBER_OF_PUBLIC_PAGES } from '@/lib/constants';
import { FileTrigger, Button, Input } from 'react-aria-components';
import FileUploadIcon from './icons/FileUploadIcon';
import { twJoin } from 'tailwind-merge';
import Reactpdfviewer from './Reactpdfviewer2';
import ClientPDFViewer from './ClientPDFViewer';
import Collapsable from './Collapsable';
import { usePDFDocument } from './PDFDocumentProvider';
import Header from './Header';
import Footer from './icons/Footer';

type ViewerMode = 'client' | 'server' | null;

const BasicLayout: React.FC = () => {
    const [base64string, setBase64string] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('');
    const [viewerMode, setViewerMode] = useState<ViewerMode>(null);
    const [isPending, startTransition] = useTransition();
    const { isFullPage, fullPageRef, setFullPageRef } = useFullPage();
    const currentFullPageRef = useRef<HTMLElement>(null);
    const { setFilename } = usePDFDocument();
    const [urlInput, setUrlInput] = useState<string>('');

    useEffect(() => {
        if (!fullPageRef) {
            setFullPageRef(currentFullPageRef);
        }
    }, [setFullPageRef, fullPageRef]);

    const handleFileUpload = async (file: File | null) => {
        if (!file) return;

        startTransition(async () => {
            setFilename(file.name);
            const formData = new FormData();
            formData.append('pdffile', file, file.name);
            formData.append('publicpages', MAXIMAL_NUMBER_OF_PUBLIC_PAGES.toString());

            const convertPDFObject = await convertPDF(formData);
            if (convertPDFObject) {
                const { base64string, aspectRatio } = convertPDFObject;
                setBase64string(base64string);
                setAspectRatio(aspectRatio);
                setViewerMode('server'); // Changed from 'client' to 'server' since we're using base64
                setPdfUrl(''); // Clear any existing URL
            } else {
                setBase64string(null);
                setViewerMode(null);
            }
        });
    };

    const handleLocalPDF = async () => {
        startTransition(async () => {
            const result = await loadLocalPDF('dummy.pdf');
            if (result) {
                const { base64string, aspectRatio } = result;
                setBase64string(base64string);
                setAspectRatio(aspectRatio);
                setViewerMode('server');
                setPdfUrl('');
                setFilename('dummy.pdf');
            } else {
                alert('Failed to load local PDF');
            }
        });
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        startTransition(async () => {
            try {
                if (urlInput.startsWith('http')) {
                    // External URL - use client-side rendering
                    setPdfUrl(urlInput);
                    setViewerMode('client');
                    setBase64string(null);
                } else if (urlInput.startsWith('/') || !urlInput.includes('/')) {
                    // Local file - use server-side rendering
                    const filename = urlInput.startsWith('/') ? urlInput.slice(1) : urlInput;
                    const result = await loadLocalPDF(filename);
                    if (result) {
                        const { base64string, aspectRatio } = result;
                        setBase64string(base64string);
                        setAspectRatio(aspectRatio);
                        setViewerMode('server');
                        setPdfUrl('');
                        setFilename(filename);
                    }
                } else {
                    throw new Error('Invalid URL or file path');
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load PDF file');
            }
        });
    };

    return (
        <div
            className={twJoin(
                'flex flex-col justify-center mx-auto px-2 xl:px-0 max-w-[1024px]',
                isFullPage ? 'min-h-[100svh] mt-2 mb-4' : 'flex flex-col justify-center h-[100svh]'
            )}
        >
            <Collapsable isOpen={!isFullPage} className="items-center [&>div]:justify-self-center" id="fileupload">
                <Header />
                <div className="flex flex-col gap-4 w-full max-w-lg px-4">
                    {/* File Upload Section */}
                    <div className="flex justify-center items-center gap-2">
                        <FileTrigger
                            acceptDirectory={false}
                            acceptedFileTypes={['application/pdf']}
                            onSelect={(e) => e && handleFileUpload(e.item(0))}
                        >
                            <Button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                <FileUploadIcon />
                                <span>Upload PDF</span>
                            </Button>
                        </FileTrigger>

                        {/* Add this button for loading dummy PDF */}
                        <Button
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            onPress={handleLocalPDF}
                        >
                            Load Dummy PDF
                        </Button>
                    </div>

                    {/* URL Input Section */}
                    <div className="flex w-full">
                        <form onSubmit={handleUrlSubmit} className="flex w-full gap-2">
                            <Input
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Enter PDF URL or /dummy.pdf"
                                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Load URL
                            </Button>
                        </form>
                    </div>
                </div>
            </Collapsable>

            <main
                ref={currentFullPageRef}
                className={twJoin(
                    'flex-1 flex flex-col',
                    isPending ? 'justify-center' : 'justify-stretch',
                    isFullPage ? '' : 'overflow-hidden'
                )}
            >
                {isPending ? (
                    <div className="text-2xl text-center">Processing...</div>
                ) : viewerMode === 'client' ? (
                    <ClientPDFViewer url={pdfUrl} />
                ) : viewerMode === 'server' ? (
                    <Reactpdfviewer base64string={base64string} aspectRatio={aspectRatio} />
                ) : (
                    <div className="text-center text-gray-500 mt-8">
                        Upload a PDF file or enter a URL to view
                    </div>
                )}
            </main>

            <Collapsable isOpen={!isFullPage} className="items-center [&>div]:justify-self-center" id="footer">
                <Footer />
            </Collapsable>
        </div>
    );
};

export default BasicLayout;