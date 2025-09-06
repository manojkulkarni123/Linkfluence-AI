from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from oauth import router as oauth_router
from linkedin import post_to_linkedin
from typing import List, Literal, Optional
from Generate_post import generate_post, store_generated_post
import supabase
from db import supabase

app = FastAPI(title="LinkedIn Post Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000",
                   "http://localhost:3000",
                    "https://linkedin-post-generator-ue5d.vercel.app",  # Your Vercel app
                    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the OAuth router
app.include_router(oauth_router, tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "Welcome to LinkedIn Post Generator API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}         


@app.post("/Post_to_linkedin/{post_id}")
async def upload_linkedin_post(
    user_id: str,
    post_id: str,
    files: Optional[List[UploadFile]] = File(None),
    text: Optional[str] = Form(None)
    ##changed form to accept text
):
    """Create a LinkedIn post with optional images."""
    try:
        
        if files:
            # Validate files
            for file in files:
                if not file.content_type or not file.content_type.startswith('image/'):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File '{file.filename}' is not an image"
                    )
                
                # Check file size (10MB limit)
                content = await file.read()
                await file.seek(0)  # Reset file pointer
                
                if len(content) > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File '{file.filename}' is too large (max 10MB)"
                    )
        

        post = supabase.table("generated_posts").select("*").eq("id", post_id).execute()
        if not post.data:
             raise HTTPException(status_code=404, detail="Post not found")
             
        post_data = post.data[0]
        ##added final_text here
        final_text = text if text else post_data["generated_text"]

        # Create the post
        result = await post_to_linkedin(user_id=post_data["user_id"], text=final_text, image_files=files)

        # Handle errors
        if "error" in result:
            if "User not found" in result["error"]:
                raise HTTPException(status_code=404, detail=result["error"])
            elif "connect" in result["error"].lower():
                raise HTTPException(status_code=503, detail=result["error"])
            elif "timeout" in result["error"].lower():
                raise HTTPException(status_code=504, detail=result["error"])
            else:
                raise HTTPException(status_code=400, detail=result["error"])
            
        if "id" in result:
            supabase.table("generated_posts").update({
                "posted": True,
                "post_id": result["id"]
            }).eq("id", post_id).execute()
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.get("/create_post/")
async def create_post(user_id: str, text: str,   length: Literal["short", "medium", "long"], note:str):

    generated_result = await generate_post(user_id=user_id, text=text,length=length,note=note)
        
    
    stored_post = await store_generated_post(
        user_id=user_id,
        generated_text=generated_result["generated_text"],
        original_text=text,
        length=length,
        note=note
    )
    
    return {
        "post_id": stored_post["id"],
        "generated_text": generated_result["generated_text"],
        "message": "Post generated and stored successfully"
    }


if __name__== "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=4000)