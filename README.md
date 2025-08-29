# LinkedIn Post Generator 📱

A full-stack application that helps users generate and manage LinkedIn posts using AI, with direct LinkedIn integration for posting.

## Features 🌟

- OAuth2 authentication with LinkedIn
- AI-powered post generation with customizable:
  - Length (short, medium, long)
  - Structure and Goal
- Media upload support
- Post management system
- Direct posting to LinkedIn

## Tech Stack 🛠️

### Backend
- FastAPI (Python)
- Supabase (Database)
- OpenAI API
- LinkedIn API
- pytest (Testing)

### Frontend
- React.js
- TailwindCSS
- React Router
- Axios

## Prerequisites 📋

- Python 3.11+
- Node.js 18+
- LinkedIn Developer Account
- Supabase Account
- OpenAI API Key

## Installation 💻

1. Clone the repository:
```bash
git clone <repository-url>
cd linkedin-Post-Generator
```

2. Backend Setup:
```bash
cd backend
python -m venv env
env\Scripts\activate
pip install -r app/requirements.txt
```

3. Frontend Setup:
```bash
cd linkedin-post-generator-frontend
npm install
```

4. Environment Configuration:
Create `.env` file in backend directory:
````properties
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
LINKEDIN_REDIRECT_URI="http://127.0.0.1:4000/auth/callback"

SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_key"
OPENAI_API_KEY="your_openai_key"
````

## Running the Application 🚀

1. Start the Backend:
```bash
cd backend
env\Scripts\activate
uvicorn app.main:app --reload --port 4000
```

2. Start the Frontend:
```bash
cd linkedin-post-generator-frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/docs

## API Endpoints 🛣️

### Authentication
- `GET /auth/linkedin` - Initiate LinkedIn OAuth flow
- `GET /auth/callback` - OAuth callback handler

### Posts
- `GET /create_post/` - Generate new post
- `POST /Post_to_linkedin/{post_id}` - Post to LinkedIn
- `POST /Upload_media/` - Upload media for posts

## Database Schema 💾

### Users Table
```sql
create table users (
  linkedin_id text primary key,
  access_token text,
  email text,
  name text
);
```

### Generated Posts Table
```sql
create table generated_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id text references users(linkedin_id),
  generated_text text,
  original_text text,
  created_at timestamptz default now(),
  posted boolean default false,
  post_id text,
  length text,
  tone text
);
```

## Testing 🧪

Run backend tests:
```bash
cd backend
pytest app/test_auth.py -v
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License 📄

This project is licensed under the MIT License

## Acknowledgments 🙏

- LinkedIn API Documentation
- OpenAI API
- Supabase Documentation
- FastAPI Documentation
