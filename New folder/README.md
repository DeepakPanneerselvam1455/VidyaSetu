# VidyaSetu - AI-Powered Learning Platform

VidyaSetu is a comprehensive Learning Management System (LMS) enhanced with Generative AI capabilities. It connects students with mentors, provides adaptive learning resources, and leverages AI to generate quizzes and personalized content.

## Features

- **AI-Powered Assessments**: Automatically generate quizzes from course materials or topics using Google Gemini AI.
- **Mentorship Automation**: Streamlined mentorship requests and session scheduling.
- **Course Management**: Detailed course creation with support for video, PDF, and link resources.
- **Interactive Forums**: Community discussions with threading and voting.
- **Supabase Integration**: robust backend for authentication, database, and file storage.
- **Progress Tracking**: Monitor student performance analytics and completion rates.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions ready)
- **AI**: Google Gemini AI (via `@google/genai` SDK)

## Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- A Supabase Project
- A Google AI Studio API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd VidyaSetu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory (copy `.env.local` if available) and add your credentials:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```

4. **Database Setup**:
   The project requires a specific database schema. The migration script is located at `server/schema.sql`.
   The app uses the following tables:
   - `profiles` (extends Supabase Auth)
   - `courses`, `quizzes`, `quiz_attempts`
   - `forum_categories`, `forum_threads`, `forum_posts`
   - `mentorship_requests`, `tutoring_sessions`
   - `activity_logs`, `user_progress`

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Usage

- **Register/Login**: Create an account to access features.
- **Dashboard**: View your courses, progress, and mentorship status.
- **Admin**: Admins can manage users and platform settings (Role management requires direct DB access or Admin UI).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
