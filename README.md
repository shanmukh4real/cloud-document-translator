# Cloud Translation Service

A web-based translation tool that uses Google Cloud Translation API for both text-to-text and document-to-document translation.

## Screenshots

### Main Interface
![Main Interface](images/screenshot-main.png)

### Text Translation
![Text Translation](images/screenshot-text.png)

### Document Translation
![Document Translation](images/screenshot-document.png)

## Features

- **Text Translation**: Translate text between Indian languages with auto-detection
- **Document Translation with Formatting**: Upload and translate documents while preserving structure
  - **DOCX files**: Tables, headings, lists, bold, italic, and other formatting preserved
  - **PDF files**: Text extracted and translated (layout approximated)
  - **TXT files**: Plain text translation
- **Formatted Preview**: View translated DOCX documents with all formatting intact
- **Drag & Drop**: Easy file upload with drag-and-drop support
- **Offline Storage**: API key stored securely in your browser
- **Responsive Design**: Works on desktop and mobile devices
- **Large Document Support**: Automatic chunking for documents up to 10MB

## How to Run Locally

### Option 1: Double-Click (Simplest)
1. Simply double-click on `index.html`
2. It will open in your default web browser

### Option 2: Using a Local Server (Recommended)
If you have Python installed:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

### Option 3: Using Node.js
If you have Node.js installed:

```bash
npx http-server -p 8000
```

Then open: http://localhost:8000

## Setup Instructions

### ⚠️ Important Security Notice
**Never commit your API keys to version control!** See [API_KEYS_EXAMPLE.md](API_KEYS_EXAMPLE.md) for detailed configuration instructions.

1. **Get API Keys**:
   - **Google Cloud Translation API Key** (Required):
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select an existing one
     - Enable the "Cloud Translation API"
     - Go to "Credentials" and create an API key
     - Copy your API key

   - **Groq API Key** (Optional - for synonym feature):
     - Visit [Groq Console](https://console.groq.com/)
     - Sign up and generate an API key

2. **Configure the App**:
   - Open the webpage
   - Scroll down to "API Configuration"
   - Paste your Google Cloud API key
   - Click "Save Key"
   - For Groq API (synonyms), either use the UI or see [API_KEYS_EXAMPLE.md](API_KEYS_EXAMPLE.md)

3. **Start Translating**:
   - Use the "Text Translation" tab for quick text translations
   - Use the "Document Translation" tab to translate entire documents

## Supported Languages

**Indian Languages:**
- Hindi
- Bengali
- Telugu
- Marathi
- Tamil
- Gujarati
- Kannada
- Malayalam
- Punjabi
- Urdu
- English

## Supported Document Formats

- **Text files (.txt)**: Plain text translation
- **PDF documents (.pdf)**: Text extraction and translation (formatting not preserved)
- **Word documents (.docx)**: Full formatting preservation including:
  - Tables with borders and structure
  - Headings and paragraphs
  - Bold, italic, and underline
  - Numbered and bulleted lists
  - Block quotes and other styles

**Maximum file size**: 10MB

## Format Preservation

When translating DOCX files, the application preserves:
- Document structure (headings, paragraphs, sections)
- Tables with all rows, columns, and borders
- Text formatting (bold, italic, underline)
- Lists (numbered and bulleted)
- The translated document is displayed as a formatted preview in the browser
- **Download as DOCX**: Export the translated document back to Word format (.docx)
- **Download as HTML**: Save as a standalone HTML file that can be opened in any browser
- You can toggle between formatted view and HTML source code
- The translated DOCX file maintains the same structure as the original, with only the language changed

## Security & Privacy

### API Key Storage
- Your Google Cloud API key is stored locally in your browser's localStorage
- Keys are never sent to any third party except:
  - Google Cloud Translation API (for translations)
  - Groq API (for synonym suggestions, if configured)

### Important Security Practices
- **Never commit API keys** to version control
- Use API key restrictions in Google Cloud Console to limit:
  - Allowed APIs
  - Allowed websites/IP addresses
  - Request quotas
- Monitor your API usage regularly for unauthorized access
- Rotate API keys periodically
- If a key is exposed, revoke it immediately and generate a new one

## Troubleshooting

**API Key Not Working?**
- Ensure the Cloud Translation API is enabled in your Google Cloud project
- Check if your API key has the correct permissions
- Verify there are no restrictions on your API key

**File Upload Not Working?**
- Check if the file size is under 10MB
- Ensure the file format is supported
- Try a different file

**CORS Errors?**
- Use a local server (Option 2 or 3 above) instead of opening the file directly
- This resolves cross-origin resource sharing issues

## Browser Compatibility

Works on all modern browsers:
- Chrome (Recommended)
- Firefox
- Safari
- Edge

## License

Free to use for personal and commercial projects.
