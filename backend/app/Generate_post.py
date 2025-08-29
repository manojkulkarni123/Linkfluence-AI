from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from config import OPENAI_API_KEY
import supabase
from fastapi import HTTPException
from db import supabase

async def generate_post(user_id: str, text: str, length: str, note: str) -> dict:
    """
    Generate engaging LinkedIn posts that get results.
    
    Args:
        user_id: User identifier
        text: Topic or idea for your post
        length: "short", "medium", or "long" 
     
    Returns:
        Ready-to-post LinkedIn content with proper formatting
    """
    
    # Initialize the AI
    llm = ChatOpenAI(
        temperature=0.7,
        model_name="gpt-4",
        openai_api_key=OPENAI_API_KEY
    )
    

    
    
    # Master system prompt - dynamic LinkedIn post generation
    system_prompt = """
        You are a LinkedIn expert who writes posts that people actually stop to read, engage with, and share.

        Your style:
        - Conversational and authentic
        - Short sentences, like talking to a friend
        - No emojis, no hashtags
        - Always format with line breaks for readability

        Your task:
        Dynamically decide the best way to write the post based on the topic, context, Persona, and goal provided.

        Guidelines:
        - If the structure includes anything wrt virality use Hook/Value/Story/CTA → follow it closely.
        - If the goal is casual sharing → keep it simple and reflective, skip hook and CTA.
        - If the goal is thought leadership → go deeper, provide insights + story + a strong closing idea.
        - If the goal is polishing → rewrite clearly while preserving the author’s voice.
        - Ensure clarity, flow, and authenticity.
        - Always generate a ready-to-post LinkedIn text, formatted with proper line breaks.
        """

        # Length guidelines
    length_map = {
            "short": "under 200 words - quick and punchy",
            "medium": "200-300 words - balanced depth",
            "long": "300-500 words - detailed with story"
        }

        # Dynamic prompt template
    prompt_template = f"""
        {system_prompt}

        Topic: {text}
        Desired structure and end goal: {note}
        Length: {length_map[length]}

        Output:
        A compelling LinkedIn post that adapts dynamically to the given structure and goal. 
        Make it engaging, conversational, and easy to read with proper paragraph breaks.
        """

    try:
        # Generate the post
        response = await llm.ainvoke(prompt_template)
        
        generated_text=response.content.strip().replace('"', '')
        # Return the content with proper formatting preserved
        return  {
            "generated_text":generated_text,
            "status":"success"
        }
    
    except Exception as e:
       return {
            "error": str(e),
            "status": "failed"
        }


async def store_generated_post(
    user_id: str, 
    generated_text: str, 
    original_text: str,
    length: str,
    note: str
) -> dict:
    try:
        response = supabase.table("generated_posts").insert({
            "user_id": user_id,
            "generated_text": generated_text,
            "original_text": original_text,
            "length": length,
            "note": note
        }).execute()
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store post: {str(e)}")