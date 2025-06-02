## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, MongoDB, JWT authentication
- **AI**: OpenAI GPT-4o-mini for document analysis
- **Storage**: AWS S3 for file storage

## 🚀 Quick Start

### 1. Install Dependencies

```bash
git clone https://github.com/your-username/fagproeve-2025.git
cd fagproeve-2025
npm install
# or
bun install
```

### 2. Environment Setup

Create `.env`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/fagproeve-2025

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run the Application

```bash
npm run dev
# or
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
fagproeve-2025/
├── app/
│   ├── api/                 # API endpoints
│   ├── components/          # React components
│   ├── lib/                 # Shared libraries
│   ├── models/              # Database schemas
│   ├── utils/               # Utility functions
│   └── page.tsx             # Main page
├── public/                  # Static assets
```

## 📱 Usage

1. **Register/Login**: Create account or sign in
2. **Upload Documents**: Drag and drop files or click to browse
3. **AI Analysis**: Documents are automatically analyzed and categorized
4. **Search & Filter**: Use categories, tags, and text search to find documents
5. **Manage Files**: View, download, or delete your documents
