"""OAuth (Open Authorization) is an open-standard protocol that allows third-party applications to access user data from a service 
(like social media platforms) without exposing the user's credentials. It provides a secure and standardized way for applications 
to gain limited access to user accounts."""
 
"""OAuth flow 
1. User initiates login via LinkedIn.
2. Redirect to LinkedIn for authorization.
3. LinkedIn redirects back with an authorization code.
4. Send Auth code to linkedin in exchange for access token.
5. Use access token to fetch user profile and use the permission to post on behalf of the user.
6. Store user info and token in Supabase.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import asyncio
from config import LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI
from db import supabase

router = APIRouter()

AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"

@router.get("/auth/linkedin")
def linkedin_login():
    url = (
        f"{AUTH_URL}?response_type=code"
        f"&client_id={LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_REDIRECT_URI}"
        f"&scope=openid%20profile%20w_member_social"
    )
    return RedirectResponse(url)

@router.get("/auth/callback")
async def linkedin_callback(code: str):
    try:
        print(f"Received code: {code}")
        
        # Use httpx with more aggressive connection settings
        timeout = httpx.Timeout(30.0)
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        
        async with httpx.AsyncClient(
            verify=False, 
            timeout=timeout, 
            limits=limits,
            http2=False,  
            follow_redirects=True
        ) as client:
            # Exchange code for access token
            token_data = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            }
            
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            
            print("Exchanging code for token...")
            
            # Try the request with retries
            for attempt in range(3):
                try:
                    token_response = await client.post(TOKEN_URL, data=token_data, headers=headers)
                    break
                except (httpx.ConnectError, httpx.RemoteProtocolError) as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    if attempt == 2:  # Last attempt
                        raise
                    await asyncio.sleep(1)  # Wait 1 second before retry
            
            print(f"Token response status: {token_response.status_code}")
            if token_response.status_code != 200:
                print(f"Token error response: {token_response.text}")
                raise HTTPException(status_code=400, detail=f"Failed to get token: {token_response.text}")
            
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            if not access_token:
                print(f"No access token in response: {token_json}")
                raise HTTPException(status_code=400, detail="No access token received")
            
            print("Got access token, fetching profile...")
            
            # Get user profile with retry
            profile_headers = {"Authorization": f"Bearer {access_token}"}
            for attempt in range(3):
                try:
                    profile_response = await client.get("https://api.linkedin.com/v2/userinfo", headers=profile_headers)
                    break
                except (httpx.ConnectError, httpx.RemoteProtocolError) as e:
                    print(f"Profile attempt {attempt + 1} failed: {e}")
                    if attempt == 2:  # Last attempt
                        raise
                    await asyncio.sleep(1)  # Wait 1 second before retry
            
            print(f"Profile response status: {profile_response.status_code}")
            if profile_response.status_code != 200:
                print(f"Profile error response: {profile_response.text}")
                raise HTTPException(status_code=400, detail=f"Failed to get profile: {profile_response.text}")
            
            profile = profile_response.json()
            print(f"Profile data: {profile}")
            
            linkedin_id = profile.get("sub")  # Standard OpenID Connect claim
            name = profile.get("name", "")  # Full name from userinfo
            email = profile.get("email", f"user_{profile.get('sub')}@linkedin.local")  # Email if available
            
            print(f"Storing user: {linkedin_id}, {name}, {email}")
            
            try:
                existing_user = supabase.table("users").select("id, linkedin_id").eq("linkedin_id", linkedin_id).execute()
                
                if existing_user.data:
                    # User exists, update their info using the UUID primary key
                    user_id = existing_user.data[0]["id"]
                    result = supabase.table("users").update({
                        "name": name,
                        "email": email,
                        "access_token": access_token
                    }).eq("id", user_id).execute()
                    print(f"Updated existing user with ID {user_id}: {result}")
                else:
                    # New user, insert (UUID will be auto-generated)
                    result = supabase.table("users").insert({
                        "linkedin_id": linkedin_id,
                        "name": name,
                        "email": email,
                        "access_token": access_token
                    }).execute()
                    print(f"Inserted new user: {result}")
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
                # Continue anyway
                
            return {
                "message": "LinkedIn login successful", 
                "linkedin_id": linkedin_id,
                "name": name,
                "email": email
            }
            
    except (httpx.ConnectError, httpx.RemoteProtocolError) as e:
        print(f"Connection error: {e}")
        # Fallback: try with requests as a last resort
    #     try:
    #         import requests
    #         print("Falling back to requests library...")
            
    #         token_data = {
    #             "grant_type": "authorization_code",
    #             "code": code,
    #             "redirect_uri": LINKEDIN_REDIRECT_URI,
    #             "client_id": LINKEDIN_CLIENT_ID,
    #             "client_secret": LINKEDIN_CLIENT_SECRET,
    #         }
            
    #         headers = {"Content-Type": "application/x-www-form-urlencoded"}
            
    #         # Try with requests
    #         session = requests.Session()
    #         session.verify = False  # Disable SSL verification
            
    #         token_response = session.post(TOKEN_URL, data=token_data, headers=headers, timeout=30)
    #         token_response.raise_for_status()
    #         token_json = token_response.json()
    #         access_token = token_json.get("access_token")
            
    #         if not access_token:
    #             raise HTTPException(status_code=400, detail="No access token received")
            
    #         # Get profile with requests
    #         profile_headers = {"Authorization": f"Bearer {access_token}"}
    #         profile_response = session.get("https://api.linkedin.com/v2/userinfo", headers=profile_headers, timeout=30)
    #         profile_response.raise_for_status()
    #         profile = profile_response.json()
            
    #         linkedin_id = profile.get("sub")
    #         name = profile.get("name", "")
    #         email = profile.get("email", f"user_{profile.get('sub')}@linkedin.local")
            
    #         result = supabase.table("users").upsert({
    #             "linkedin_id": linkedin_id,
    #             "name": name,
    #             "email": email,
    #             "access_token": access_token
    #         }, on_conflict="linkedin_id").execute()
            
    #         return {
    #             "message": "LinkedIn login successful (via requests fallback)", 
    #             "linkedin_id": linkedin_id,
    #             "name": name,
    #             "email": email
    #         }
            
    #     except Exception as fallback_error:
    #         print(f"Fallback also failed: {fallback_error}")
    #         raise HTTPException(status_code=500, detail=f"All connection methods failed: {str(e)}")
    
    # except httpx.ConnectError as e:
    #     print(f"Connection error: {e}")
    #     raise HTTPException(status_code=500, detail="Failed to connect to LinkedIn. Check your internet connection.")
    
    # except httpx.TimeoutException as e:
    #     print(f"Timeout error: {e}")
    #     raise HTTPException(status_code=500, detail="LinkedIn request timed out. Please try again.")
    
    # except Exception as e:
    #     print(f"Unexpected error: {e}")
    #     raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


