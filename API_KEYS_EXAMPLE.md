# API Keys Configuration

This application requires API keys to function. **Never commit actual API keys to version control.**

## Required API Keys

### 1. Google Cloud Translation API Key
- **Purpose**: Powers text and document translation
- **How to get**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project or select an existing one
  3. Enable the "Cloud Translation API"
  4. Go to "Credentials" and create an API key
  5. Copy your API key

### 2. Groq API Key (Optional - for synonym feature)
- **Purpose**: Provides AI-powered synonym suggestions
- **How to get**:
  1. Visit [Groq Console](https://console.groq.com/)
  2. Sign up or log in
  3. Generate an API key
  4. Copy your API key

## How to Configure

### Option 1: Using the Web Interface (Recommended)
1. Open the application in your browser
2. Navigate to the "API Configuration" section
3. Paste your Google Cloud API key and save
4. The key will be stored in your browser's localStorage

### Option 2: Hardcoding (For Development Only)
**WARNING: Do NOT commit files with actual API keys!**

1. Open `script.js`
2. Find line 1000 (Groq API Configuration)
3. Replace the empty string with your Groq API key:
   ```javascript
   const GROQ_API_KEY = 'your-groq-api-key-here';
   ```

## Security Best Practices

- Never commit API keys to Git
- Use environment variables for production deployments
- Regenerate keys if accidentally exposed
- Set up API key restrictions in Google Cloud Console
- Monitor your API usage regularly
