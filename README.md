# Code Atlas

A Next.js application that visualizes codebase structure and performs deep AI analysis using a multi-agent system.

## Features

- 📂 **File Tree Visualization**: Interactive visualization of project structure with pan and zoom
- 🤖 **Multi-Agent AI Analysis**: 5-agent system for comprehensive code understanding
- 🧠 **AI-Powered Summaries**: File and function-level summaries using OpenAI GPT
- 🔍 **Vector Search**: Semantic search capabilities with Chroma vector database
- 📊 **Relationship Mapping**: Import dependencies and function call analysis
- 💾 **Structured Storage**: SQLite database with Prisma for type-safe data access

## Multi-Agent Architecture

| Step | Agent | Function | Output |
|------|-------|----------|---------|
| 🗂️ 1 | **Unzipper Agent** | Extract and read files/folders | File tree structure |
| 🧠 2 | **Summarizer Agent** | AI-powered code understanding | Summary text |
| 🔍 3 | **Linker Agent** | Detect imports/function calls | Dependencies graph |
| 📦 4 | **Chunker Agent** | Break large files into chunks | Better AI memory |
| 🔍 5 | **Embedder Agent** | Create searchable vectors | Stored in Chroma DB |

## Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Python 3.8-3.11** (for Chroma vector database)
- **OpenAI API Key** (for AI analysis)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Start Chroma Vector Server

**Option A: Using npm script (recommended)**
```bash
npm run chroma
```

**Option B: Using shell script directly**
```bash
./scripts/start-chroma.sh
```

**Option C: Manual Python command**
```bash
pip3 install chromadb
/Users/YOUR_USERNAME/Library/Python/3.9/bin/chroma run --host localhost --port 8000 --path ./chroma_data
```

The Chroma server will be available at: `http://localhost:8000`

### 5. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to use the application.

## Debugging & Status

Check the status of all components:

```bash
node scripts/debug-analysis.js
```

This will show:
- ✅/❌ Database status
- ✅/❌ Chroma server status  
- 📊 Analysis statistics
- 📁 Upload directory status

## Supported Languages

- **JavaScript** (.js, .jsx)
- **TypeScript** (.ts, .tsx)  
- **Python** (.py)
- **Java** (.java)
- **Go** (.go)
- **Rust** (.rs)

## Database Schema

```sql
File     -> id, path, lang, size, summary
Folder   -> id, path, summary
Function -> id, fileId, name, start, end, summary
CallEdge -> from, to (function-level graph)
ImportEdge -> from, to (file-level graph)
Job      -> id, status, message, createdAt, updatedAt
```

## API Endpoints

- `POST /api/upload` - Upload ZIP file and start analysis
- `GET /api/ingest/[jobId]/status` - Check job status
- `GET /api/nodes/[path]` - Get detailed node analysis
- `GET /api/analysis/results` - Get complete analysis results
- `GET /api/analysis/stats` - Get analysis statistics

## How It Works

1. **Upload**: User uploads a ZIP file via the web interface
2. **Extraction**: Files are extracted to `uploads/[jobId]` directory
3. **Multi-Agent Processing**:
   - **Unzipper Agent**: Creates file tree structure
   - **Summarizer Agent**: Generates AI summaries for files and functions
   - **Linker Agent**: Detects imports and function calls using Tree-sitter
   - **Chunker Agent**: Breaks content into manageable chunks
   - **Embedder Agent**: Creates vector embeddings and stores in Chroma
4. **Storage**: Metadata stored in SQLite, vectors in Chroma
5. **Visualization**: Interactive file tree with AI-powered tooltips
6. **Analysis Dashboard**: Comprehensive results view with function details

## Troubleshooting

### Chroma Server Issues

If Chroma fails to start:

1. **Check Python installation**:
   ```bash
   python3 --version  # Should be 3.8-3.11
   ```

2. **Install/update Chroma**:
   ```bash
   pip3 install --user chromadb
   ```

3. **Find Chroma executable**:
   ```bash
   find /Users/$USER/Library/Python -name "chroma" -type f
   ```

4. **Add to PATH** (optional):
   ```bash
   echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Database Issues

If database queries fail:

```bash
# Recreate database
rm prisma/atlas.db
npx prisma db push
```

### Missing OpenAI API Key

AI analysis will be skipped if no API key is provided. Set your key in `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

## Development

### Project Structure

```
code-atlas/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── workers/            # Background processing
│   └── types/              # TypeScript types
├── prisma/                 # Database schema
├── scripts/               # Utility scripts
└── uploads/              # Uploaded files (created automatically)
```

### Key Components

- **TreeCanvas**: React Flow visualization
- **CustomNode**: File/folder nodes with hover tooltips
- **AnalysisPanel**: Multi-agent status tracking
- **AnalysisResults**: Comprehensive results dashboard
- **IngestWorker**: Background multi-agent processing

## Production Deployment

1. **Database**: Use PostgreSQL or MySQL instead of SQLite
2. **Vector Store**: Deploy Chroma to a dedicated server
3. **File Storage**: Use S3 or similar for uploaded files
4. **Environment**: Set production environment variables
5. **Scaling**: Consider worker queues for heavy processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `npm run lint` before committing
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
