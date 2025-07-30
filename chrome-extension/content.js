// CareerNest Chrome Extension - Content Script
// Extracts job posting data from various job sites

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    const jobData = extractJobData();
    sendResponse({ success: true, data: jobData });
  }
  return true;
});

// Main function to extract job data based on current site
function extractJobData() {
  const hostname = window.location.hostname;
  const url = window.location.href;
  
  console.log('Extracting job data from:', hostname);
  
  let jobData = {
    company: '',
    position: '',
    location: '',
    salary: '',
    jobDescription: ''
  };
  
  try {
    // LinkedIn Jobs
    if (hostname.includes('linkedin.com')) {
      jobData = extractLinkedInData();
    }
    // Indeed
    else if (hostname.includes('indeed.com')) {
      jobData = extractIndeedData();
    }
    // Glassdoor
    else if (hostname.includes('glassdoor.com')) {
      jobData = extractGlassdoorData();
    }
    // Lever
    else if (hostname.includes('lever.co')) {
      jobData = extractLeverData();
    }
    // Greenhouse
    else if (hostname.includes('greenhouse.io')) {
      jobData = extractGreenhouseData();
    }
    // Google Careers
    else if (hostname.includes('careers.google.com')) {
      jobData = extractGoogleCareersData();
    }
    // Microsoft Careers
    else if (hostname.includes('careers.microsoft.com')) {
      jobData = extractMicrosoftCareersData();
    }
    // Generic extraction for other sites
    else {
      jobData = extractGenericData();
    }
    
    // Clean up extracted data
    jobData = cleanJobData(jobData);
    
  } catch (error) {
    console.error('Error extracting job data:', error);
  }
  
  return jobData;
}

// LinkedIn Jobs extraction
function extractLinkedInData() {
  return {
    company: getTextContent('.job-details-jobs-unified-top-card__company-name a') ||
             getTextContent('.job-details-jobs-unified-top-card__company-name'),
    position: getTextContent('.job-details-jobs-unified-top-card__job-title h1') ||
              getTextContent('.job-details-jobs-unified-top-card__job-title'),
    location: getTextContent('.job-details-jobs-unified-top-card__bullet') ||
              getTextContent('.job-details-jobs-unified-top-card__primary-description-text'),
    salary: extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('.job-details-jobs-unified-top-card__job-description') ||
                   getTextContent('.jobs-description-content__text')
  };
}

// Indeed extraction
function extractIndeedData() {
  return {
    company: getTextContent('[data-testid="inlineHeader-companyName"] a') ||
             getTextContent('[data-testid="inlineHeader-companyName"]'),
    position: getTextContent('[data-testid="jobsearch-JobInfoHeader-title"]') ||
              getTextContent('h1[data-testid="jobsearch-JobInfoHeader-title"]'),
    location: getTextContent('[data-testid="job-location"]') ||
              getTextContent('[data-testid="inlineHeader-companyLocation"]'),
    salary: getTextContent('[data-testid="jobsearch-JobMetadataHeader-item"]') ||
            extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('#jobDescriptionText') ||
                   getTextContent('[data-testid="jobsearch-jobDescriptionText"]')
  };
}

// Glassdoor extraction
function extractGlassdoorData() {
  return {
    company: getTextContent('[data-test="employer-name"]') ||
             getTextContent('.employerName'),
    position: getTextContent('[data-test="job-title"]') ||
              getTextContent('.jobTitle'),
    location: getTextContent('[data-test="job-location"]') ||
              getTextContent('.location'),
    salary: getTextContent('[data-test="detailSalary"]') ||
            extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('[data-test="jobDescriptionContainer"]') ||
                   getTextContent('.jobDescriptionContent')
  };
}

// Lever extraction
function extractLeverData() {
  return {
    company: getTextContent('.company-name') ||
             document.title.split(' - ')[1] || '',
    position: getTextContent('.posting-headline h2') ||
              getTextContent('h2'),
    location: getTextContent('.location') ||
              getTextContent('.posting-categories .location'),
    salary: extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('.posting-requirements') ||
                   getTextContent('.posting-description')
  };
}

// Greenhouse extraction
function extractGreenhouseData() {
  return {
    company: getTextContent('#header .company-name') ||
             document.title.split(' - ')[1] || '',
    position: getTextContent('#header h1') ||
              getTextContent('h1'),
    location: getTextContent('#header .location') ||
              getTextContent('.location'),
    salary: extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('#content .application-description') ||
                   getTextContent('.job-post-description')
  };
}

// Google Careers extraction
function extractGoogleCareersData() {
  return {
    company: 'Google',
    position: getTextContent('h1') ||
              getTextContent('[data-test-id="job-title"]'),
    location: getTextContent('[data-test-id="job-location"]') ||
              extractLocationFromText(document.body.innerText),
    salary: extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('[data-test-id="job-description"]') ||
                   getTextContent('.job-description')
  };
}

// Microsoft Careers extraction
function extractMicrosoftCareersData() {
  return {
    company: 'Microsoft',
    position: getTextContent('h1') ||
              getTextContent('.job-title'),
    location: getTextContent('.job-location') ||
              extractLocationFromText(document.body.innerText),
    salary: extractSalaryFromText(document.body.innerText),
    jobDescription: getTextContent('.job-description') ||
                   getTextContent('[data-automation-id="jobPostingDescription"]')
  };
}

// Generic extraction for unknown sites
function extractGenericData() {
  const title = document.title;
  const bodyText = document.body.innerText;
  
  return {
    company: extractCompanyFromTitle(title) || extractCompanyFromText(bodyText),
    position: extractPositionFromTitle(title) || extractPositionFromText(bodyText),
    location: extractLocationFromText(bodyText),
    salary: extractSalaryFromText(bodyText),
    jobDescription: extractJobDescriptionFromText(bodyText)
  };
}

// Helper functions
function getTextContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

function extractSalaryFromText(text) {
  const salaryRegex = /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per\s+)?(?:year|annually|yr|k))?/gi;
  const match = text.match(salaryRegex);
  return match ? match[0] : '';
}

function extractLocationFromText(text) {
  const locationRegex = /(?:Remote|Hybrid|On-site|[\w\s]+,\s*[A-Z]{2}|[\w\s]+,\s*[\w\s]+)/gi;
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.match(locationRegex) && line.length < 100) {
      return line.trim();
    }
  }
  return '';
}

function extractCompanyFromTitle(title) {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return '';
}

function extractCompanyFromText(text) {
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    if (line.includes('Company') || line.includes('Employer')) {
      return line.replace(/Company|Employer/gi, '').trim();
    }
  }
  return '';
}

function extractPositionFromTitle(title) {
  const parts = title.split(' - ');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return '';
}

function extractPositionFromText(text) {
  const h1 = document.querySelector('h1');
  if (h1) {
    return h1.textContent.trim();
  }
  return '';
}

function extractJobDescriptionFromText(text) {
  const lines = text.split('\n');
  let description = '';
  let capturing = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('job description') || 
        line.toLowerCase().includes('responsibilities') ||
        line.toLowerCase().includes('requirements')) {
      capturing = true;
      continue;
    }
    
    if (capturing && line.trim().length > 50) {
      description += line + '\n';
      if (description.length > 1000) break;
    }
  }
  
  return description.trim();
}

function cleanJobData(data) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      cleaned[key] = value
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\-.,()$]/g, '')
        .trim()
        .substring(0, key === 'jobDescription' ? 2000 : 200);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

console.log('CareerNest content script loaded on:', window.location.hostname);
