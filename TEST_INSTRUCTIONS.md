# Testing the Synonym Feature

## Steps to Test:

1. **Open the application**
   - Open `index.html` in your browser (Chrome or Firefox recommended)

2. **Configure API Key**
   - Scroll down to "API Configuration"
   - Enter your Google Cloud API key
   - Click "Save Key"

3. **Test Translation**
   - Go to "Text Translation" tab
   - Enter some text in English (e.g., "The quick brown fox jumps over the lazy dog")
   - Click "Translate Text"
   - Wait for translation to complete

4. **Test Synonym Feature**
   - **IMPORTANT**: Open browser console (Press F12, click "Console" tab)
   - You should see these messages:
     - "Synonym feature initialized successfully"
     - "=== updateEditableTranslation called ==="
     - "Word-selectable spans: X" (where X is number of words)

5. **Click on Words**
   - Click on any word in the translated text
   - You should see in console:
     - "Click detected on: [span element]"
     - "Valid word clicked: [word]"
     - "Fetching synonyms for: [word]"

   - A popup should appear showing:
     - Loading spinner
     - Then either synonyms or an error message

6. **Select a Synonym**
   - Click on any synonym in the popup
   - The word should be replaced
   - The popup should close

## Troubleshooting:

### If words are not clickable:
- Check console for "Word-selectable spans: 0" - this means words weren't wrapped properly
- Refresh the page and try again

### If clicking doesn't show popup:
- Check console for "Click detected on" message
- If no message appears, the event listener isn't attached

### If you see "Network error" or CORS error:
- The CORS proxy might be down
- Try changing `USE_CORS_PROXY = false` in script.js line 1003
- Or try a different CORS proxy

### If synonyms don't load:
- Check your internet connection
- Verify the Groq API key is valid
- Check browser console for API errors

## Expected Console Output (Success):

```
Synonym feature initialized successfully
=== updateEditableTranslation called ===
Text to translate: [your translated text]
Total words/spaces: 15
Updated HTML and attached click listener
Word-selectable spans: 9
Click detected on: <span class="word-selectable">...</span>
Valid word clicked: quick
Fetching synonyms for: quick
API Response: {...}
Parsed synonyms: ['fast', 'rapid', 'swift', ...]
```
