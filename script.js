// Global variables
let apiKey = '';
let selectedFile = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    loadApiKey();
    setupCharCounter();
    setupDragAndDrop();
    initializeSynonymFeature();
    // Ensure translated text area starts centered
    const translatedArea = document.getElementById('translated-text');
    if (translatedArea) {
        translatedArea.style.textAlign = 'center';
    }
});

// Tab switching
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');

    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// Character counter for text input
function setupCharCounter() {
    const sourceText = document.getElementById('source-text');
    const charCount = document.getElementById('char-count');
    const maxChars = 25000;

    sourceText.addEventListener('input', function () {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;

        // Change color if approaching or exceeding limit
        if (currentLength > maxChars) {
            charCount.style.color = '#ff0000';
            charCount.textContent = `${currentLength} (exceeds limit of ${maxChars})`;
        } else if (currentLength > maxChars * 0.9) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#888';
        }
    });
}

// API Key Management
function saveApiKey() {
    const keyInput = document.getElementById('api-key');
    apiKey = keyInput.value.trim();

    if (apiKey) {
        localStorage.setItem('gcloud_api_key', apiKey);
        showStatus('API key saved successfully!', 'success');
    } else {
        showStatus('Please enter a valid API key', 'error');
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem('gcloud_api_key');
    if (savedKey) {
        apiKey = savedKey;
        document.getElementById('api-key').value = savedKey;
    }
}

// Text Translation
async function translateText() {
    if (!apiKey) {
        showStatus('Please configure your API key first', 'error', 'text-status');
        return;
    }

    const sourceText = document.getElementById('source-text').value.trim();
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;

    if (!sourceText) {
        showStatus('Please enter text to translate', 'error', 'text-status');
        return;
    }

    // Check payload size (Google Cloud Translation API limit is ~200KB)
    const maxChars = 25000; // Safe limit to stay under 200KB payload
    if (sourceText.length > maxChars) {
        showStatus(`Text is too long. Maximum ${maxChars} characters allowed. Your text has ${sourceText.length} characters.`, 'error', 'text-status');
        return;
    }

    showStatus('Translating...', 'info', 'text-status');
    document.getElementById('translate-text-btn').disabled = true;

    try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const requestBody = {
            q: sourceText,
            target: targetLang,
            format: 'text'
        };

        // Only include source if it's not auto-detect
        if (sourceLang !== 'auto') {
            requestBody.source = sourceLang;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Translation failed');
        }

        const data = await response.json();
        const translatedText = data.data.translations[0].translatedText;
        const detectedLang = data.data.translations[0].detectedSourceLanguage;

        // Update both the editable div and hidden textarea
        updateEditableTranslation(translatedText);

        let statusMsg = 'Translation completed successfully! Click on any word for synonyms.';
        if (detectedLang && sourceLang === 'auto') {
            statusMsg += ` (Detected: ${detectedLang})`;
        }
        showStatus(statusMsg, 'success', 'text-status');

    } catch (error) {
        console.error('Translation error:', error);
        showStatus('Error: ' + error.message, 'error', 'text-status');
    } finally {
        document.getElementById('translate-text-btn').disabled = false;
    }
}

// Copy translation to clipboard
function copyTranslation() {
    const editableDiv = document.getElementById('translated-text-editable');
    const text = editableDiv.innerText;

    // Create temporary textarea to copy text
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = text;
    tempTextarea.style.position = 'fixed';
    tempTextarea.style.opacity = '0';
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);

    const copyBtn = document.getElementById('copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// File handling
function setupDragAndDrop() {
    const uploadArea = document.getElementById('upload-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            document.getElementById('file-input').files = files;
            handleFileSelect({ target: { files: files } });
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showStatus('File size exceeds 10MB limit', 'error', 'doc-status');
        return;
    }

    // Validate file type - TXT, PDF, DOCX supported
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
        showStatus('Only TXT, PDF, and DOCX files are supported.', 'error', 'doc-status');
        return;
    }

    selectedFile = file;
    displayFileInfo(file);
}

function displayFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    const fileSize = (file.size / 1024).toFixed(2);

    fileInfo.innerHTML = `
        <div class="file-details">
            <span class="file-name">📄 ${file.name}</span>
            <span class="file-size">${fileSize} KB</span>
            <button onclick="clearFile()" class="clear-btn">✕</button>
        </div>
    `;
    fileInfo.style.display = 'block';
}

function clearFile() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('download-section').innerHTML = '';
}

// Document Translation
async function translateDocument() {
    if (!apiKey) {
        showStatus('Please configure your API key first', 'error', 'doc-status');
        return;
    }

    if (!selectedFile) {
        showStatus('Please select a file to translate', 'error', 'doc-status');
        return;
    }

    const sourceLang = document.getElementById('doc-source-lang').value;
    const targetLang = document.getElementById('doc-target-lang').value;

    showStatus('Reading document...', 'info', 'doc-status');
    document.getElementById('translate-doc-btn').disabled = true;

    try {
        // Read the file with format information
        const fileData = await readFileAsText(selectedFile);

        let translatedContent;
        let contentType;

        // Handle HTML content (from DOCX)
        if (fileData.type === 'html') {
            console.log('Processing DOCX with HTML formatting');
            console.log('HTML length:', fileData.html ? fileData.html.length : 0);
            showStatus('Translating formatted document...', 'info', 'doc-status');
            translatedContent = await translateHtmlContent(fileData.html, sourceLang, targetLang);
            console.log('Translated HTML length:', translatedContent ? translatedContent.length : 0);
            contentType = 'html';
        } else {
            // Handle plain text (from TXT and PDF)
            const maxChars = 20000;
            const chunks = splitIntoChunks(fileData.content, maxChars);

            showStatus(`Translating document in ${chunks.length} part(s)... Please wait.`, 'info', 'doc-status');

            const translatedChunks = [];

            for (let i = 0; i < chunks.length; i++) {
                showStatus(`Translating part ${i + 1} of ${chunks.length}...`, 'info', 'doc-status');

                const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

                const requestBody = {
                    q: chunks[i],
                    target: targetLang,
                    format: 'text'
                };

                if (sourceLang !== 'auto') {
                    requestBody.source = sourceLang;
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Translation failed');
                }

                const data = await response.json();
                const translatedChunk = data.data.translations[0].translatedText;

                console.log(`Chunk ${i + 1} translated:`, translatedChunk.substring(0, 100) + '...');
                translatedChunks.push(translatedChunk);

                // Small delay between requests to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            translatedContent = translatedChunks.join('\n\n');
            contentType = 'text';

            console.log('Final translated text length:', translatedContent.length);
            console.log('First 200 chars:', translatedContent.substring(0, 200));

            if (!translatedContent || translatedContent.trim().length === 0) {
                throw new Error('Translation resulted in empty content');
            }
        }

        // Create download link with appropriate content type
        createDownloadLink(translatedContent, selectedFile.name, contentType);
        showStatus('Document translated successfully with formatting preserved!', 'success', 'doc-status');

    } catch (error) {
        console.error('Document translation error:', error);
        showStatus('Error: ' + error.message, 'error', 'doc-status');
    } finally {
        document.getElementById('translate-doc-btn').disabled = false;
    }
}

// Translate HTML content while preserving structure
async function translateHtmlContent(html, sourceLang, targetLang) {
    console.log('translateHtmlContent called with HTML length:', html.length);

    // Parse HTML to extract text nodes
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    console.log('Parsed HTML, body exists:', !!doc.body);
    console.log('Body HTML preview:', doc.body ? doc.body.innerHTML.substring(0, 200) : 'null');

    // Get all text nodes
    const textNodes = [];
    const walker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Only accept text nodes with actual content
                if (node.nodeValue.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    console.log('Found text nodes:', textNodes.length);

    // Collect all text to translate
    const textsToTranslate = textNodes.map(node => node.nodeValue.trim());

    if (textsToTranslate.length === 0) {
        console.error('No text content found in document');
        throw new Error('No text content found in document');
    }

    console.log('First 3 texts to translate:', textsToTranslate.slice(0, 3));

    // Translate in batches to avoid API limits
    const batchSize = 100; // Translate up to 100 text segments at once
    const translatedTexts = [];

    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
        const batch = textsToTranslate.slice(i, i + batchSize);

        showStatus(`Translating elements ${i + 1}-${Math.min(i + batchSize, textsToTranslate.length)} of ${textsToTranslate.length}...`, 'info', 'doc-status');

        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const requestBody = {
            q: batch,
            target: targetLang,
            format: 'text'
        };

        if (sourceLang !== 'auto') {
            requestBody.source = sourceLang;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Translation failed');
        }

        const data = await response.json();
        const translations = data.data.translations.map(t => t.translatedText);
        translatedTexts.push(...translations);

        // Small delay between batches
        if (i + batchSize < textsToTranslate.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Replace text nodes with translated content
    textNodes.forEach((node, index) => {
        node.nodeValue = translatedTexts[index];
    });

    // Return the translated HTML
    const translatedHtml = doc.body.innerHTML;
    console.log('Returning translated HTML, length:', translatedHtml.length);
    console.log('Translated HTML preview:', translatedHtml.substring(0, 200));
    return translatedHtml;
}

// Split text into chunks at paragraph boundaries
function splitIntoChunks(text, maxChars) {
    if (text.length <= maxChars) {
        return [text];
    }

    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If a single paragraph is too large, split it by sentences
        if (paragraph.length > maxChars) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            const sentences = paragraph.split(/(?<=[.!?])\s+/);
            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length > maxChars) {
                    if (currentChunk) {
                        chunks.push(currentChunk.trim());
                    }
                    currentChunk = sentence;
                } else {
                    currentChunk += (currentChunk ? ' ' : '') + sentence;
                }
            }
        } else if (currentChunk.length + paragraph.length + 2 > maxChars) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function readFileAsText(file) {
    const fileName = file.name.toLowerCase();

    try {
        // Handle PDF files
        if (fileName.endsWith('.pdf')) {
            const text = await extractTextFromPDF(file);
            return { content: text, type: 'text' };
        }

        // Handle DOCX files
        if (fileName.endsWith('.docx')) {
            return await extractTextFromDOCX(file);
        }

        // Handle plain text files
        const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read text file'));
            };

            reader.readAsText(file, 'UTF-8');
        });

        return { content: text, type: 'text' };
    } catch (error) {
        throw new Error(`Error reading file: ${error.message}`);
    }
}

// Extract text from PDF with layout preservation
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                // Configure PDF.js worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;

                let fullText = '';

                // Extract text from each page
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    // Sort items by vertical position to preserve layout
                    const sortedItems = textContent.items.sort((a, b) => {
                        // Sort by y position (top to bottom), then x position (left to right)
                        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                            return b.transform[5] - a.transform[5];
                        }
                        return a.transform[4] - b.transform[4];
                    });

                    let currentY = null;
                    let lineText = '';

                    sortedItems.forEach((item, index) => {
                        const y = item.transform[5];

                        // Check if we're on a new line
                        if (currentY === null || Math.abs(currentY - y) > 5) {
                            if (lineText) {
                                fullText += lineText + '\n';
                            }
                            lineText = item.str;
                            currentY = y;
                        } else {
                            // Same line, add space if needed
                            if (lineText && !lineText.endsWith(' ') && !item.str.startsWith(' ')) {
                                lineText += ' ';
                            }
                            lineText += item.str;
                        }
                    });

                    // Add the last line
                    if (lineText) {
                        fullText += lineText + '\n';
                    }

                    // Add page separator
                    if (pageNum < pdf.numPages) {
                        fullText += '\n--- Page ' + (pageNum + 1) + ' ---\n\n';
                    }
                }

                resolve(fullText);
            } catch (error) {
                reject(new Error('Failed to extract text from PDF: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read PDF file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

// Extract HTML from DOCX with formatting preserved
async function extractTextFromDOCX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const arrayBuffer = e.target.result;

                // Use mammoth to convert to HTML, preserving formatting
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

                if (result.value) {
                    resolve({ html: result.value, type: 'html' });
                } else {
                    reject(new Error('No content found in DOCX file'));
                }

                // Log any warnings
                if (result.messages.length > 0) {
                    console.log('DOCX extraction warnings:', result.messages);
                }
            } catch (error) {
                reject(new Error('Failed to extract content from DOCX: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read DOCX file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

function createDownloadLink(content, originalFileName, contentType = 'text') {
    console.log('createDownloadLink called');
    console.log('Content type:', contentType);
    console.log('Content length:', content ? content.length : 0);
    console.log('Content preview:', content ? content.substring(0, 100) : 'null');

    const fileNameParts = originalFileName.split('.');
    const extension = fileNameParts.pop();
    const baseName = fileNameParts.join('.');
    const newFileName = `${baseName}_translated.${extension}`;

    const downloadSection = document.getElementById('download-section');

    if (contentType === 'html') {
        // For HTML content, show formatted preview
        const decodedContent = decodeHtmlEntities(content);
        console.log('Decoded HTML length:', decodedContent.length);
        console.log('Decoded HTML preview:', decodedContent.substring(0, 100));

        // Store the content globally for download function to access
        window.translatedHtmlContent = decodedContent;

        downloadSection.innerHTML = `
            <div class="download-card">
                <h4>Translation Complete!</h4>
                <p>Your document has been translated with formatting preserved. Review the content below.</p>

                <div class="translated-content-area">
                    <div class="content-header">
                        <label>Translated Content (Document Preview)</label>
                    </div>
                    <div id="formatted-preview" class="formatted-preview" style="display: block; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; background: white; max-height: 500px; overflow-y: auto; line-height: 1.6; min-height: 200px; text-align: center;"></div>
                    <div style="margin-top: 10px; padding: 10px; background: #f0f4ff; border-radius: 6px; font-size: 0.9em; color: #555;">
                        <strong>Note:</strong> The translated content is displayed above with all formatting preserved (tables, headings, lists, etc.).
                    </div>
                </div>

                <div class="action-buttons">
                    <button onclick="downloadTranslatedDocument('${escapeHtml(newFileName)}', 'docx')" class="download-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        Download as Word Document
                    </button>
                </div>
            </div>
        `;

        // Now inject the content into the preview div (this must happen AFTER the HTML is inserted into DOM)
        setTimeout(() => {
            const previewDiv = document.getElementById('formatted-preview');
            if (previewDiv) {
                previewDiv.innerHTML = decodedContent;
            }
        }, 0);
    } else {
        // For plain text content
        const decodedContent = decodeHtmlEntities(content);

        downloadSection.innerHTML = `
            <div class="download-card">
                <h4>Translation Complete!</h4>
                <p>Review and edit your translated document below. Click download when ready.</p>

                <div class="translated-content-area">
                    <div class="content-header">
                        <label for="translated-content">Translated Content (Editable)</label>
                        <span class="content-stats">${decodedContent.length} characters</span>
                    </div>
                    <textarea id="translated-content" rows="20">${escapeHtml(decodedContent)}</textarea>
                </div>

                <div class="action-buttons">
                    <button onclick="downloadTranslatedDocument('${escapeHtml(newFileName)}', 'text')" class="download-btn">
                        Download Document
                    </button>
                    <button onclick="copyTranslatedContent()" class="copy-content-btn">
                        Copy All Text
                    </button>
                </div>
            </div>
        `;
        // Center align the translated content textarea after it is added
        const out = document.getElementById('translated-content');
        if (out) {
            out.style.textAlign = 'center';
        }
    }
}

// Download the translated document
function downloadTranslatedDocument(fileName, contentType = 'text') {
    let content;
    let mimeType;
    let blob;

    if (contentType === 'docx') {
        // Get HTML content - use the global variable if available, otherwise try DOM
        let htmlContent;
        if (window.translatedHtmlContent) {
            htmlContent = window.translatedHtmlContent;
        } else {
            const htmlSourceElem = document.getElementById('html-source');
            if (htmlSourceElem && htmlSourceElem.value) {
                htmlContent = htmlSourceElem.value;
            } else {
                const previewElem = document.getElementById('formatted-preview');
                htmlContent = previewElem ? previewElem.innerHTML : '';
            }
        }

        if (!htmlContent || htmlContent.trim().length === 0) {
            alert('Cannot download empty content!');
            return;
        }

        // Create complete HTML document for Word with proper namespace and styles
        const fullHtmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset='utf-8'>
    <title>Translated Document</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body {
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            text-align: center;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px auto;
        }
        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        p {
            margin: 10px 0;
            text-align: center;
        }
        h1, h2, h3, h4, h5, h6 {
            margin: 15px 0 10px 0;
            text-align: center;
        }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

        // Use .doc format (older Word format) which directly accepts HTML
        // This is much more reliable than trying to create DOCX
        blob = new Blob(['\ufeff', fullHtmlContent], {
            type: 'application/msword'
        });
        fileName = fileName.replace(/\.[^.]+$/, '.doc');
    } else if (contentType === 'html') {
        // Get HTML content from either preview or source
        const htmlSourceElem = document.getElementById('html-source');
        if (htmlSourceElem) {
            content = htmlSourceElem.value;
        } else {
            const previewElem = document.getElementById('formatted-preview');
            content = previewElem.innerHTML;
        }

        // Create full HTML document
        content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translated Document</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
            text-align: center;
        }
        .content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px auto;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        p {
            text-align: center;
        }
        h1, h2, h3, h4, h5, h6 {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="content">
        ${content}
    </div>
</body>
</html>`;
        mimeType = 'text/html;charset=utf-8';
        fileName = fileName.replace(/\.[^.]+$/, '.html');
        blob = new Blob([content], { type: mimeType });
    } else {
        content = document.getElementById('translated-content').value;
        mimeType = 'text/plain;charset=utf-8';
        blob = new Blob([content], { type: mimeType });
    }

    if (!blob) {
        alert('Cannot download empty content!');
        return;
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Downloaded file:', fileName);
}

// Toggle between formatted preview and HTML source
function toggleViewMode() {
    const preview = document.getElementById('formatted-preview');
    const source = document.getElementById('html-source');
    const btn = event.target;

    if (preview.style.display === 'none') {
        // Switch to preview
        preview.style.display = 'block';
        source.style.display = 'none';
        btn.textContent = 'Switch to HTML Source';
    } else {
        // Switch to source
        preview.style.display = 'none';
        source.style.display = 'block';
        btn.textContent = 'Switch to Preview';
    }
}

// Copy formatted HTML content to clipboard
function copyFormattedContent() {
    const source = document.getElementById('html-source');
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = source.value;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);

    // Show feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#4caf50';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

// Copy translated content to clipboard
function copyTranslatedContent() {
    const textarea = document.getElementById('translated-content');
    textarea.select();
    document.execCommand('copy');

    // Show feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#4caf50';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

// Escape HTML for safe insertion
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Status message helper
function showStatus(message, type, elementId = 'text-status') {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// ===== SYNONYM SUGGESTION FEATURE =====

// Groq API Configuration
const GROQ_API_KEY = ''; // Add your Groq API key here or set it in the UI
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const USE_CORS_PROXY = true;

// Global variables for synonym feature
let currentWord = null;
let currentWordElement = null;
let fullTranslatedText = '';

// Initialize synonym feature
function initializeSynonymFeature() {
    console.log('Synonym feature initializing...');

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('synonym-popup');
        const editableArea = document.getElementById('translated-text-editable');

        if (popup && popup.style.display === 'block' &&
            !popup.contains(e.target) &&
            editableArea && !editableArea.contains(e.target)) {
            closeSynonymPopup();
        }
    });

    console.log('Synonym feature initialized successfully');
}

// Handle word click - SIMPLIFIED VERSION
function handleWordClick(event) {
    const target = event.target;

    console.log('Click detected on:', target);

    // Check if clicked on a word span
    if (target.classList && target.classList.contains('word-selectable')) {
        const word = target.textContent.trim().replace(/[.,!?;:'"()]/g, '');

        if (word.length > 1) {
            console.log('Valid word clicked:', word);
            currentWord = word;
            currentWordElement = target;
            showSynonymPopup(word, event.clientX, event.clientY);
        }
    } else {
        console.log('Clicked element is not a word-selectable span');
    }
}

// Show synonym popup
function showSynonymPopup(word, x, y) {
    const popup = document.getElementById('synonym-popup');
    const originalSpan = document.getElementById('synonym-original');
    const contentDiv = document.getElementById('synonym-content');

    // Set original word
    originalSpan.textContent = word;

    // Show loading state
    contentDiv.innerHTML = `
        <div class="synonym-loading">
            <div class="synonym-loading-spinner"></div>
            Finding synonyms...
        </div>
    `;

    // Position popup
    popup.style.display = 'block';
    popup.style.left = x + 'px';
    popup.style.top = (y + 20) + 'px';

    // Adjust position if popup goes off screen
    const rect = popup.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        popup.style.left = (window.innerWidth - rect.width - 20) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        popup.style.top = (y - rect.height - 10) + 'px';
    }

    // Fetch synonyms
    fetchSynonyms(word, fullTranslatedText);
}

// Fetch synonyms from Groq API
async function fetchSynonyms(word, context) {
    const contentDiv = document.getElementById('synonym-content');

    try {
        // Limit context to avoid large payloads
        const limitedContext = context.length > 500 ? context.substring(0, 500) + '...' : context;

        const prompt = `You must provide synonyms in the SAME LANGUAGE as the given word.

Word: "${word}"
Context: "${limitedContext}"

Task: Provide 5-7 synonyms for the word "${word}" in the SAME language (Telugu, Hindi, English, etc.). The synonyms must be in the exact same script and language as the original word.

IMPORTANT:
- If the word is in Telugu (తెలుగు), provide Telugu synonyms only
- If the word is in English, provide English synonyms only
- Return ONLY a comma-separated list of synonyms
- NO explanations, NO numbering, NO extra text

Example format: పదం1, పదం2, పదం3 (for Telugu) or word1, word2, word3 (for English)

Synonyms:`;

        console.log('Fetching synonyms for:', word);

        // Direct API call (CORS proxy not working reliably)
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that provides contextually appropriate synonyms for multiple languages(Telugu and English). Always respond with only a comma-separated list of synonyms, nothing else.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        const synonymsText = data.choices[0].message.content.trim();
        console.log('Raw synonyms text from API:', synonymsText);

        // Parse synonyms (handle both comma-separated and numbered lists)
        let synonyms = synonymsText
            .split(/[,\n]/)
            .map(s => s.trim())
            .map(s => s.replace(/^\d+\.\s*/, '')) // Remove numbering if present
            .map(s => s.replace(/^[-•]\s*/, '')) // Remove bullet points
            .filter(s => s.length > 0 && s.toLowerCase() !== word.toLowerCase())
            .slice(0, 7); // Limit to 7 synonyms

        console.log('Parsed synonyms:', synonyms);

        if (synonyms.length === 0) {
            contentDiv.innerHTML = `
                <div class="synonym-error">
                    No synonyms found for "${escapeHtml(word)}"
                </div>
            `;
            return;
        }

        // Display synonyms
        contentDiv.innerHTML = synonyms.map(syn => `
            <div class="synonym-item" onclick="replaceSynonym('${escapeHtml(syn)}')">
                <span class="synonym-item-text">${escapeHtml(syn)}</span>
                <span class="synonym-item-icon">→</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching synonyms:', error);

        let errorMessage = 'Unable to fetch synonyms.';

        // Check if it's a CORS error
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            errorMessage = `
                <strong>CORS Error!</strong><br>
                Please run the app through the local server:<br>
                <small>
                1. Double-click <code>START_SERVER.bat</code><br>
                2. Or run <code>python server.py</code><br>
                3. Open <code>http://localhost:8000</code>
                </small>
            `;
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Check your internet connection.';
        } else {
            errorMessage = `Error: ${escapeHtml(error.message)}`;
        }

        contentDiv.innerHTML = `
            <div class="synonym-error">
                ${errorMessage}
            </div>
        `;
    }
}

// Replace word with selected synonym
function replaceSynonym(synonym) {
    if (!currentWordElement) return;

    // Unescape the synonym
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = synonym;
    const unescapedSynonym = tempDiv.textContent;

    // Replace the word
    currentWordElement.textContent = unescapedSynonym;

    // Update the full text
    const editableDiv = document.getElementById('translated-text-editable');
    fullTranslatedText = editableDiv.innerText;

    // Update the hidden textarea for copy functionality
    const textarea = document.getElementById('translated-text');
    textarea.value = fullTranslatedText;

    // Close popup
    closeSynonymPopup();

    // Show feedback
    showStatus('Word replaced successfully!', 'success', 'text-status');
}

// Close synonym popup
function closeSynonymPopup() {
    const popup = document.getElementById('synonym-popup');
    popup.style.display = 'none';
    currentWord = null;
    currentWordElement = null;
}

// Convert translated text to editable format with word wrapping
function updateEditableTranslation(text) {
    console.log('=== updateEditableTranslation called ===');
    console.log('Text to translate:', text);

    const editableDiv = document.getElementById('translated-text-editable');
    if (!editableDiv) {
        console.error('Editable div not found!');
        return;
    }

    fullTranslatedText = text;

    // Split text into words and wrap each in a clickable span
    const words = text.split(/(\s+)/); // Keep whitespace
    console.log('Total words/spaces:', words.length);

    const html = words.map(word => {
        // Check if it's a word (not just whitespace)
        // Use Unicode-aware regex that matches letters in ANY language
        if (word.trim().length > 0 && /[\p{L}\p{N}]+/u.test(word)) {
            return `<span class="word-selectable">${escapeHtml(word)}</span>`;
        } else {
            // It's whitespace or punctuation
            return escapeHtml(word);
        }
    }).join('');

    editableDiv.innerHTML = html;

    // Add click event listener to the div
    // Remove old listener if exists
    const newDiv = editableDiv.cloneNode(true);
    editableDiv.parentNode.replaceChild(newDiv, editableDiv);

    // Add fresh event listener
    newDiv.addEventListener('click', handleWordClick);

    console.log('Updated HTML and attached click listener');
    console.log('Word-selectable spans:', newDiv.querySelectorAll('.word-selectable').length);

    // Also update hidden textarea
    const textarea = document.getElementById('translated-text');
    if (textarea) {
        textarea.value = text;
    }
}
