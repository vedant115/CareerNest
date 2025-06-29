from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import fitz
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")
genai.configure(api_key=api_key)

# Prompts for different analysis types
PROMPTS = {
    "general": """
    You are an experienced Technical Human Resource Manager, your task is to review the provided resume against the job description. 
    Please share your professional evaluation on whether the candidate's profile aligns with the role. 
    Highlight the strengths and weaknesses of the applicant in relation to the specified job requirements.
    """,
    
    "skills": """
    You are a Technical Human Resource Manager with expertise in data science, 
    your role is to scrutinize the resume in light of the job description provided. 
    Share your insights on the candidate's suitability for the role from an HR perspective. 
    Additionally, offer advice on enhancing the candidate's skills and identify areas where improvement is needed.
    """,
    
    "keywords": """
    You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality, 
    your task is to evaluate the resume against the provided job description. As a Human Resource manager,
    assess the compatibility of the resume with the role. Give me what are the keywords that are missing
    Also, provide recommendations for enhancing the candidate's skills and identify which areas require further development.
    """,
    
    "percentage": """
    You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality, 
    your task is to evaluate the resume against the provided job description. give me the percentage of match if the resume matches
    the job description. First the output should come as percentage and then keywords missing and last final thoughts.
    """
}

# AI Prep prompt for generating interview questions
AI_PREP_PROMPT = """
You are an experienced Technical Interview Specialist and Career Coach. Your task is to generate exactly 10 relevant interview questions with detailed explanations for a candidate preparing for a specific role.

Based on the provided information:
- Target Role: {target_role}
- Years of Experience: {years_experience}
- Topics to Focus On: {topics}
- Additional Description: {description}

Generate exactly 10 interview questions that are:
1. Relevant to the target role and experience level
2. Cover the specified topics to focus on
3. Appropriate for the candidate's experience level
4. Mix of technical, behavioral, and situational questions

For each question, provide:
- The interview question
- A detailed explanation covering why this question is important, key points the interviewer is looking for, tips for answering effectively, and common mistakes to avoid

IMPORTANT: You must respond with ONLY a valid JSON array. No other text before or after. The JSON should be an array of exactly 10 objects, each with "question" and "explanation" fields.

Example format:
[
  {
    "question": "Example question here?",
    "explanation": "Detailed explanation here..."
  }
]

Return ONLY the JSON array, nothing else.
"""

def get_gemini_response(input_prompt, pdf_content, job_description):
    """Generate response from Gemini API"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([input_prompt, pdf_content, job_description])
        return response.text
    except Exception as e:
        return f"Error generating response: {str(e)}"

def extract_text_from_pdf(pdf_bytes):
    """Extract text content from PDF bytes"""
    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_parts = []
        for page in document:
            text_parts.append(page.get_text())
        return " ".join(text_parts)
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"

@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    """API endpoint to analyze resume against job description"""
    # Check if required data is present
    if 'resume' not in request.files:
        return jsonify({"error": "Missing resume file"}), 400
    
    if 'jobDescription' not in request.form:
        return jsonify({"error": "Missing job description"}), 400
    
    try:
        # Get data from request
        resume_file = request.files['resume']
        job_description = request.form['jobDescription']
        analysis_type = request.form.get('analysisType', 'general')
        
        # Validate file type
        if not resume_file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Read and process PDF
        pdf_bytes = resume_file.read()
        pdf_text = extract_text_from_pdf(pdf_bytes)
        
        if pdf_text.startswith("Error"):
            return jsonify({"error": pdf_text}), 500
        
        # Get appropriate prompt
        prompt = PROMPTS.get(analysis_type, PROMPTS["general"])
        
        # Get analysis from Gemini
        analysis = get_gemini_response(prompt, pdf_text, job_description)
        
        if analysis.startswith("Error"):
            return jsonify({"error": analysis}), 500
        
        # Return successful response
        return jsonify({
            "success": True,
            "analysis": analysis,
            "analysisType": analysis_type
        })
        
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/generate-interview-questions', methods=['POST'])
def generate_interview_questions():
    """API endpoint to generate interview questions based on role and experience"""
    try:
        # Get data from request
        data = request.get_json()
        print(f"Received data: {data}")

        if not data:
            print("No data received")
            return jsonify({"error": "Missing request data"}), 400

        target_role = data.get('targetRole', '').strip()
        years_experience = data.get('yearsExperience', '').strip()
        topics = data.get('topics', '').strip()
        description = data.get('description', '').strip()

        # Validate required fields
        if not target_role:
            return jsonify({"error": "Target role is required"}), 400

        if not years_experience:
            return jsonify({"error": "Years of experience is required"}), 400

        # Format the prompt with user data
        formatted_prompt = f"""
You are an experienced Technical Interview Specialist and Career Coach. Your task is to generate exactly 10 relevant interview questions with detailed explanations for a candidate preparing for a specific role.

Based on the provided information:
- Target Role: {target_role}
- Years of Experience: {years_experience}
- Topics to Focus On: {topics if topics else "General topics relevant to the role"}
- Additional Description: {description if description else "No additional description provided"}

Generate exactly 10 interview questions that are:
1. Relevant to the target role and experience level
2. Cover the specified topics to focus on
3. Appropriate for the candidate's experience level
4. Mix of technical, behavioral, and situational questions

For each question, provide:
- The interview question
- A detailed explanation covering why this question is important, key points the interviewer is looking for, tips for answering effectively, and common mistakes to avoid

IMPORTANT: You must respond with ONLY a valid JSON array. No other text before or after. The JSON should be an array of exactly 10 objects, each with "question" and "explanation" fields.

Return ONLY the JSON array, nothing else.
"""

        # Get response from Gemini
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(formatted_prompt)

            # Parse the JSON response
            import json
            try:
                # Clean the response text - remove any markdown formatting
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()

                questions_data = json.loads(response_text)

                # Validate that we have exactly 10 questions
                if not isinstance(questions_data, list):
                    return jsonify({"error": "Invalid response format from AI"}), 500

                if len(questions_data) != 10:
                    return jsonify({"error": f"Expected 10 questions, got {len(questions_data)}"}), 500

                # Validate each question object
                for i, item in enumerate(questions_data):
                    if not isinstance(item, dict) or 'question' not in item or 'explanation' not in item:
                        return jsonify({"error": f"Invalid question format at index {i}"}), 500

                return jsonify({
                    "success": True,
                    "questions": questions_data,
                    "metadata": {
                        "targetRole": target_role,
                        "yearsExperience": years_experience,
                        "topics": topics,
                        "description": description
                    }
                })

            except json.JSONDecodeError as e:
                return jsonify({"error": f"Failed to parse AI response as JSON: {str(e)}"}), 500

        except Exception as e:
            print(f"AI generation error: {str(e)}")
            return jsonify({"error": f"AI generation error: {str(e)}"}), 500

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "resume-analyzer-api"})

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 3000))
    
    # Run in production mode if not in debug
    debug_mode = os.environ.get('NODE_ENV') != 'production'

    app.run(host='0.0.0.0', port=port, debug=debug_mode)
