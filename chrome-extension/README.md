# CareerNest Job Tracker Chrome Extension

A Chrome extension that integrates with CareerNest, allowing you to quickly add job applications while browsing job postings.

## Features

- **Auto-fill Job Details**: Extract job information from popular job sites
- **Quick Job Tracking**: Add applications directly from job posting pages
- **Multi-site Support**: Works with LinkedIn, Indeed, Glassdoor, and 15+ other job sites

## Prerequisites

1. **CareerNest Backend**: Running on `http://localhost:5000`
2. **CareerNest Account**: Valid registered account
3. **Chrome Browser**: With Developer mode enabled

## Installation

1. **Icons**: Extension icons are already included in the `icons/` directory

2. **Load Extension in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

## Usage

1. **Start CareerNest Backend**: `cd backend && npm start`
2. **Click Extension Icon**: Login with your CareerNest credentials
3. **Visit Job Posting**: Go to LinkedIn, Indeed, or other supported job sites
4. **Auto-fill**: Click "Auto Fill from Page" to extract job details
5. **Save**: Click "Add Job Application" to save to CareerNest

## Supported Job Sites

LinkedIn, Indeed, Glassdoor, Lever, Greenhouse, Google Careers, Microsoft Careers, and 15+ others.

## File Structure

```
chrome-extension/
├── manifest.json    # Extension configuration
├── popup.html       # Extension popup interface
├── popup.css        # Styling
├── popup.js         # Main functionality
├── content.js       # Job data extraction
├── background.js    # Background script
└── icons/           # Extension icons
```

## Troubleshooting

- **Extension not working**: Check backend is running on port 5000
- **Auto-fill not working**: Try manual entry or check console for errors
- **Login issues**: Verify CareerNest credentials and backend connection
