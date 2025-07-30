from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
import fitz
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.messages import HumanMessage
import requests
from bs4 import BeautifulSoup

# Windows SQLite fix for ChromaDB
def fix_sqlite_windows():
    """Fix SQLite DLL issues on Windows"""
    if sys.platform.startswith('win'):
        try:
            # Try to fix SQLite path issues
            import sqlite3
            # Force reload of sqlite3 module
            if hasattr(sqlite3, '_sqlite'):
                del sqlite3._sqlite
            return True
        except Exception as e:
            print(f"SQLite fix attempt failed: {e}")
            return False
    return True

# Try to import ChromaDB with multiple fallback strategies
CHROMA_AVAILABLE = False
chroma_client = None

def init_chromadb():
    """Initialize ChromaDB with multiple fallback strategies"""
    global CHROMA_AVAILABLE, chroma_client

    # Try to fix SQLite issues on Windows first
    if not fix_sqlite_windows():
        print("SQLite fix failed, ChromaDB may not work")

    try:
        # Strategy 1: Try importing ChromaDB
        import chromadb
        from chromadb.config import Settings

        # Strategy 2: Try different client configurations
        try:
            # For deployment environments (like Render)
            chroma_client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=None,  # In-memory for deployment
                anonymized_telemetry=False
            ))
            CHROMA_AVAILABLE = True
            print("ChromaDB initialized successfully (in-memory mode)")
            return True

        except Exception as e1:
            try:
                # Fallback: Simple client
                chroma_client = chromadb.Client()
                CHROMA_AVAILABLE = True
                print("ChromaDB initialized successfully (simple mode)")
                return True

            except Exception as e2:
                print(f"ChromaDB client initialization failed: {e1}, {e2}")
                return False

    except ImportError as e:
        print(f"ChromaDB not available: {e}")
        return False
    except Exception as e:
        print(f"ChromaDB initialization error: {e}")
        return False

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure LangChain with Google Generative AI
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")



# Initialize LangChain model with proper configuration
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )


except Exception as e:
    print(f"Error with LangChain model: {e}")
    raise

# Initialize ChromaDB with fallback strategies
if not init_chromadb():
    print("Using in-memory fallback for vector storage")
    CHROMA_AVAILABLE = False
    chroma_client = None

# In-memory storage fallback for company research
company_research_storage = {}

# LangChain PromptTemplates for different analysis types
PROMPTS = {
    "general": PromptTemplate(
        input_variables=["pdf_content", "job_description"],
        template="""
        You are an experienced Technical Human Resource Manager, your task is to review the provided resume against the job description.
        Please share your professional evaluation on whether the candidate's profile aligns with the role.
        Highlight the strengths and weaknesses of the applicant in relation to the specified job requirements.

        Resume Content:
        {pdf_content}

        Job Description:
        {job_description}
        """
    ),

    "skills": PromptTemplate(
        input_variables=["pdf_content", "job_description"],
        template="""
        You are a Technical Human Resource Manager with expertise in data science,
        your role is to scrutinize the resume in light of the job description provided.
        Share your insights on the candidate's suitability for the role from an HR perspective.
        Additionally, offer advice on enhancing the candidate's skills and identify areas where improvement is needed.

        Resume Content:
        {pdf_content}

        Job Description:
        {job_description}
        """
    ),

    "keywords": PromptTemplate(
        input_variables=["pdf_content", "job_description"],
        template="""
        You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality,
        your task is to evaluate the resume against the provided job description. As a Human Resource manager,
        assess the compatibility of the resume with the role. Give me what are the keywords that are missing
        Also, provide recommendations for enhancing the candidate's skills and identify which areas require further development.

        Resume Content:
        {pdf_content}

        Job Description:
        {job_description}
        """
    ),

    "percentage": PromptTemplate(
        input_variables=["pdf_content", "job_description"],
        template="""
        You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality,
        your task is to evaluate the resume against the provided job description. give me the percentage of match if the resume matches
        the job description. First the output should come as percentage and then keywords missing and last final thoughts.

        Resume Content:
        {pdf_content}

        Job Description:
        {job_description}
        """
    )
}

# AI Prep ChatPromptTemplate for generating interview questions
AI_PREP_PROMPT = ChatPromptTemplate.from_template("""
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
  {{
    "question": "Example question here?",
    "explanation": "Detailed explanation here..."
  }}
]

Return ONLY the JSON array, nothing else.
""")

def get_langchain_response(prompt_template, pdf_content, job_description):
    """Generate response using LangChain"""
    try:
        # Format the prompt with the provided content
        formatted_prompt = prompt_template.format(
            pdf_content=pdf_content,
            job_description=job_description
        )

        # Get response from LangChain model
        messages = [HumanMessage(content=formatted_prompt)]
        response = llm.invoke(messages)
        return response.content
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
        
        # Get appropriate prompt template
        prompt_template = PROMPTS.get(analysis_type, PROMPTS["general"])

        # Get analysis from LangChain
        analysis = get_langchain_response(prompt_template, pdf_text, job_description)
        
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
        if not data:
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

        # Format the prompt with user data using LangChain
        formatted_prompt = AI_PREP_PROMPT.format(
            target_role=target_role,
            years_experience=years_experience,
            topics=topics if topics else "General topics relevant to the role",
            description=description if description else "No additional description provided"
        )

        # Get response from LangChain
        try:
            messages = [HumanMessage(content=formatted_prompt)]
            response = llm.invoke(messages)

            # Parse the JSON response
            try:
                # Clean the response text - remove any markdown formatting
                response_text = response.content.strip()
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

# Company Research RAG System Functions
def search_company_info(company_name):
    """Search for company information online"""
    try:
        # Simple web search for company information
        search_query = f"{company_name} company information culture news"
        search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # For demo purposes, return mock data since web scraping can be unreliable
        # In production, you'd implement proper web scraping or use APIs
        mock_info = f"""
        {company_name} is a technology company known for innovation and growth.

        Company Culture:
        - Values innovation and creativity
        - Emphasizes work-life balance
        - Collaborative team environment
        - Focus on continuous learning and development

        Recent News:
        - Expanding into new markets
        - Investing in AI and machine learning technologies
        - Commitment to sustainability initiatives
        - Strong financial performance in recent quarters

        Interview Tips:
        - Research the company's recent projects and initiatives
        - Understand their core values and mission
        - Prepare examples of how your skills align with their needs
        - Show enthusiasm for their industry and growth trajectory
        """

        return mock_info

    except Exception as e:
        return f"Error searching for company information: {str(e)}"

def store_company_info_in_vector_db(company_name, company_info):
    """Store company information in vector database or fallback storage"""
    try:
        if CHROMA_AVAILABLE and chroma_client:
            # Use ChromaDB
            collection_name = "company_research"
            try:
                collection = chroma_client.get_collection(name=collection_name)
            except:
                collection = chroma_client.create_collection(name=collection_name)

            # Split company info into chunks for better retrieval
            chunks = company_info.split('\n\n')

            # Store each chunk with metadata
            for i, chunk in enumerate(chunks):
                if chunk.strip():
                    collection.add(
                        documents=[chunk.strip()],
                        metadatas=[{"company": company_name, "chunk_id": i}],
                        ids=[f"{company_name}_chunk_{i}"]
                    )
        else:
            # Use in-memory fallback
            company_research_storage[company_name] = company_info

        return True

    except Exception as e:
        print(f"Error storing company info: {str(e)}")
        # Fallback to in-memory storage
        company_research_storage[company_name] = company_info
        return True

def query_company_info(company_name, question):
    """Query company information using RAG or fallback storage"""
    try:
        context = ""

        if CHROMA_AVAILABLE and chroma_client:
            # Use ChromaDB
            try:
                collection = chroma_client.get_collection(name="company_research")

                # Search for relevant information
                results = collection.query(
                    query_texts=[question],
                    where={"company": company_name},
                    n_results=3
                )

                if results['documents'] and results['documents'][0]:
                    context = "\n".join(results['documents'][0])
            except Exception as e:
                print(f"ChromaDB query failed: {e}, using fallback")
                context = company_research_storage.get(company_name, "")
        else:
            # Use in-memory fallback
            context = company_research_storage.get(company_name, "")

        if not context:
            return "No information found for this company. Please try researching the company first."

        # Create prompt for answering the question
        rag_prompt = PromptTemplate(
            input_variables=["context", "question", "company_name"],
            template="""
            Based on the following information about {company_name}, please answer the question.

            Company Information:
            {context}

            Question: {question}

            Please provide a comprehensive answer based on the available information. If the information is not sufficient, mention what additional research might be helpful.
            """
        )

        # Format prompt and get response
        formatted_prompt = rag_prompt.format(
            context=context,
            question=question,
            company_name=company_name
        )

        messages = [HumanMessage(content=formatted_prompt)]
        response = llm.invoke(messages)
        return response.content

    except Exception as e:
        return f"Error querying company information: {str(e)}"

@app.route('/api/research-company', methods=['POST'])
def research_company():
    """API endpoint for company research using RAG"""
    try:
        data = request.get_json()

        if not data or 'company' not in data:
            return jsonify({"error": "Company name is required"}), 400

        company_name = data['company'].strip()
        question = data.get('question', 'Tell me about this company, its culture, recent news, and interview tips.')

        if not company_name:
            return jsonify({"error": "Company name cannot be empty"}), 400

        # Search for company information
        company_info = search_company_info(company_name)

        if company_info.startswith("Error"):
            return jsonify({"error": company_info}), 500

        # Store in vector database
        stored = store_company_info_in_vector_db(company_name, company_info)

        if not stored:
            return jsonify({"error": "Failed to store company information"}), 500

        # Query the information to answer the question
        answer = query_company_info(company_name, question)

        return jsonify({
            "success": True,
            "company": company_name,
            "question": question,
            "answer": answer,
            "raw_info": company_info
        })

    except Exception as e:
        print(f"Company research error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "resume-analyzer-api"})

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 10001))
    
    # Run in production mode if not in debug
    debug_mode = os.environ.get('NODE_ENV') != 'production'

    app.run(host='0.0.0.0', port=port, debug=debug_mode)
