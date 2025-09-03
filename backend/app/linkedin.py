import asyncio
import httpx
from app.db import supabase
from fastapi import UploadFile, File, HTTPException
from typing import List, Optional

async def post_to_linkedin(user_id: str, text: str, image_files: Optional[List[UploadFile]] = None):
    """
    Posts content to LinkedIn with optional image uploads.
    
    Args:
        user_id: LinkedIn user ID
        text: Post content text
        image_files: Optional list of image files to upload
    
    Returns:
        Dict with success status and post details or error message
    """
    
    # Get user access token from database
    res = supabase.table("users").select("access_token").eq("linkedin_id", user_id).execute()
    if not res.data:
        return {"error": "User not found"}
    
    access_token = res.data[0]["access_token"]
    author_urn = f"urn:li:person:{user_id}"
    
    # Configure HTTP client
    timeout = httpx.Timeout(30.0, read=60.0)
    media_list = []
    
    try:
        async with httpx.AsyncClient(timeout=timeout, verify=True) as client:
            
            # Step 1: Upload images if provided
            if image_files:
                print(f"Uploading {len(image_files)} images...")
                
                for i, image_file in enumerate(image_files):
                    try:
                        print(f"Processing image {i+1}/{len(image_files)}: {image_file.filename}")
                        
                        # Read file content
                        file_content = await image_file.read()
                        await image_file.seek(0)  # Reset file pointer
                        
                        # Register upload with LinkedIn
                        register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
                        register_headers = {
                            "Authorization": f"Bearer {access_token}",
                            "X-Restli-Protocol-Version": "2.0.0",
                            "Content-Type": "application/json"
                        }
                        
                        register_payload = {
                            "registerUploadRequest": {
                                "owner": f"urn:li:person:{user_id}",
                                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                                "serviceRelationships": [
                                    {
                                        "relationshipType": "OWNER",
                                        "identifier": "urn:li:userGeneratedContent"
                                    }
                                ],
                                "supportedUploadMechanism": ["SYNCHRONOUS_UPLOAD"]
                            }
                        }
                        
                        # Register the upload
                        register_response = await client.post(
                            register_url, 
                            headers=register_headers, 
                            json=register_payload
                        )
                        
                        if register_response.status_code != 200:
                            error_detail = register_response.text or f"Status: {register_response.status_code}"
                            raise Exception(f"Image registration failed: {error_detail}")
                        
                        upload_data = register_response.json()
                        
                        # Extract upload URL and asset ID
                        upload_mechanism = upload_data['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
                        upload_url = upload_mechanism['uploadUrl']
                        asset_id = upload_data['value']['asset']
                        
                        print(f"Asset ID for image {i+1}: {asset_id}")
                        
                        # Upload the actual file with retry logic
                        upload_headers = {"Authorization": f"Bearer {access_token}"}
                        
                        max_retries = 3
                        upload_success = False
                        
                        for attempt in range(max_retries):
                            try:
                                upload_response = await client.put(
                                    upload_url,
                                    headers=upload_headers,
                                    content=file_content
                                )
                                
                                if upload_response.status_code == 201:
                                    print(f"Image {i+1} uploaded successfully!")
                                    upload_success = True
                                    break
                                else:
                                    print(f"Upload attempt {attempt + 1} failed: {upload_response.status_code}")
                                    if attempt == max_retries - 1:
                                        raise Exception(f"Upload failed: {upload_response.status_code} - {upload_response.text}")
                                        
                            except (httpx.ConnectError, httpx.TimeoutException) as e:
                                print(f"Network error on attempt {attempt + 1}: {e}")
                                if attempt == max_retries - 1:
                                    raise Exception(f"Failed to upload after {max_retries} attempts")
                                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        
                        if upload_success:
                            # Add to media list for the post
                            media_list.append({
                                "status": "READY",
                                "description": {"text": f"Image {i+1}"},
                                "media": asset_id,
                                "title": {"text": image_file.filename or f"Image {i+1}"}
                            })
                            
                    except Exception as e:
                        print(f"Failed to upload image {i+1}: {str(e)}")
                        return {"error": f"Failed to upload image {i+1}: {str(e)}"}
            
            # Step 2: Create the LinkedIn post
            post_data = {
                "author": author_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": text},
                        "shareMediaCategory": "IMAGE" if media_list else "NONE",
                        "media": media_list
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            print("Creating LinkedIn post...")
            post_response = await client.post(
                "https://api.linkedin.com/v2/ugcPosts",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                },
                json=post_data
            )
            
            if post_response.status_code == 201:
                result = post_response.json()
                return {
                    "success": True,
                    "post_id": result.get("id"),
                    "message": "Post created successfully",
                    "media_count": len(media_list),
                    "has_images": len(media_list) > 0
                }
            else:
                error_detail = post_response.text or f"Status: {post_response.status_code}"
                return {"error": f"Failed to create post: {error_detail}"}
                
    except httpx.ConnectError:
        return {"error": "Unable to connect to LinkedIn servers. Please check your internet connection."}
    except httpx.TimeoutException:
        return {"error": "Request to LinkedIn servers timed out. Please try again."}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"error": f"Failed to create post: {str(e)}"}