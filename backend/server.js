import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  initDatabase,
  dbRun,
  dbGet,
  dbAll
} from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing of JSON/URL-encoded bodies
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folders exist
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});
const upload = multer({ storage });

// Initialize DB schema
await initDatabase();

// ==========================================
// 1. Hierarchical Tree Navigation API
// ==========================================
app.get('/api/tree', async (req, res) => {
  try {
    const subjects = await dbAll('SELECT * FROM subjects ORDER BY title ASC');
    const topics = await dbAll('SELECT * FROM topics ORDER BY title ASC');
    const subtopics = await dbAll('SELECT * FROM subtopics ORDER BY title ASC');
    const notes = await dbAll('SELECT id, subject_id, topic_id, subtopic_id, title, is_favorite, is_pinned, created_at, updated_at FROM notes ORDER BY title ASC');

    // Build hierarchy
    const tree = subjects.map((sub) => {
      const subTopics = topics.filter((t) => t.subject_id === sub.id).map((topic) => {
        const topicSubtopics = subtopics.filter((st) => st.topic_id === topic.id).map((subtopic) => {
          const subtopicNotes = notes.filter((n) => n.subtopic_id === subtopic.id);
          return {
            ...subtopic,
            type: 'subtopic',
            notes: subtopicNotes.map(n => ({ ...n, type: 'note' }))
          };
        });

        // Notes directly under topic (where subtopic_id is NULL or 0/empty)
        const topicNotes = notes.filter((n) => n.topic_id === topic.id && !n.subtopic_id);

        return {
          ...topic,
          type: 'topic',
          subtopics: topicSubtopics,
          notes: topicNotes.map(n => ({ ...n, type: 'note' }))
        };
      });

      return {
        ...sub,
        type: 'subject',
        topics: subTopics
      };
    });

    res.json(tree);
  } catch (error) {
    console.error('Error building node tree:', error);
    res.status(500).json({ error: 'Failed to retrieve notes tree.' });
  }
});

// ==========================================
// 2. Subjects CRUD
// ==========================================
app.post('/api/subjects', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  try {
    const result = await dbRun('INSERT INTO subjects (title) VALUES (?)', [title]);
    res.status(201).json({ id: result.lastID, title, type: 'subject' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    await dbRun('UPDATE subjects SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, id]);
    res.json({ id: parseInt(id), title, type: 'subject' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM subjects WHERE id = ?', [id]);
    res.json({ success: true, message: `Subject ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Topics CRUD
// ==========================================
app.post('/api/topics', async (req, res) => {
  const { subject_id, title } = req.body;
  if (!subject_id || !title) return res.status(400).json({ error: 'Subject ID and Title are required.' });
  try {
    const result = await dbRun('INSERT INTO topics (subject_id, title) VALUES (?, ?)', [subject_id, title]);
    res.status(201).json({ id: result.lastID, subject_id, title, type: 'topic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    await dbRun('UPDATE topics SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, id]);
    res.json({ id: parseInt(id), title, type: 'topic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM topics WHERE id = ?', [id]);
    res.json({ success: true, message: `Topic ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Subtopics CRUD
// ==========================================
app.post('/api/subtopics', async (req, res) => {
  const { topic_id, title } = req.body;
  if (!topic_id || !title) return res.status(400).json({ error: 'Topic ID and Title are required.' });
  try {
    const result = await dbRun('INSERT INTO subtopics (topic_id, title) VALUES (?, ?)', [topic_id, title]);
    res.status(201).json({ id: result.lastID, topic_id, title, type: 'subtopic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subtopics/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    await dbRun('UPDATE subtopics SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, id]);
    res.json({ id: parseInt(id), title, type: 'subtopic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subtopics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM subtopics WHERE id = ?', [id]);
    res.json({ success: true, message: `Subtopic ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. Notes CRUD
// ==========================================
app.post('/api/notes', async (req, res) => {
  const { subject_id, topic_id, subtopic_id, title, content } = req.body;
  if (!subject_id || !topic_id || !title) {
    return res.status(400).json({ error: 'Subject ID, Topic ID, and Title are required.' });
  }
  const subId = subtopic_id || null;
  const bodyContent = content || '';
  try {
    const result = await dbRun(
      'INSERT INTO notes (subject_id, topic_id, subtopic_id, title, content) VALUES (?, ?, ?, ?, ?)',
      [subject_id, topic_id, subId, title, bodyContent]
    );
    const noteId = result.lastID;
    
    // Save initial history version
    await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [noteId, bodyContent]);
    
    res.status(201).json({ id: noteId, subject_id, topic_id, subtopic_id: subId, title, content: bodyContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    // Fetch tags
    const tags = await dbAll(
      `SELECT t.* FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ?`,
      [id]
    );

    // Track recently opened
    await dbRun('INSERT INTO recent_notes (note_id, opened_at) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT (note_id) DO UPDATE SET opened_at = CURRENT_TIMESTAMP', [id]);

    res.json({ ...note, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, is_favorite, is_pinned } = req.body;

  try {
    const currentNote = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!currentNote) return res.status(404).json({ error: 'Note not found.' });

    const newTitle = title !== undefined ? title : currentNote.title;
    const newContent = content !== undefined ? content : currentNote.content;
    const newFav = is_favorite !== undefined ? is_favorite : currentNote.is_favorite;
    const newPinned = is_pinned !== undefined ? is_pinned : currentNote.is_pinned;

    await dbRun(
      `UPDATE notes
       SET title = ?, content = ?, is_favorite = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newTitle, newContent, newFav, newPinned, id]
    );

    // Create a new version history if content changed
    if (content !== undefined && content !== currentNote.content) {
      // Limit to avoid duplicate rapid updates: check last version
      const lastVersion = await dbGet('SELECT content FROM note_versions WHERE note_id = ? ORDER BY id DESC LIMIT 1', [id]);
      if (!lastVersion || lastVersion.content !== content) {
        await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [id, content]);
      }
    }

    res.json({ id: parseInt(id), title: newTitle, content: newContent, is_favorite: newFav, is_pinned: newPinned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM notes WHERE id = ?', [id]);
    res.json({ success: true, message: `Note ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Global Search API
// ==========================================
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    // Search in title, content, tags, or subject titles
    const searchPattern = `%${q}%`;
    const results = await dbAll(
      `SELECT DISTINCT n.id, n.title, n.content, n.subject_id, n.topic_id, n.subtopic_id, n.created_at, n.updated_at
       FROM notes n
       LEFT JOIN note_tags nt ON nt.note_id = n.id
       LEFT JOIN tags t ON t.id = nt.tag_id
       LEFT JOIN subjects s ON s.id = n.subject_id
       LEFT JOIN topics tp ON tp.id = n.topic_id
       LEFT JOIN subtopics st ON st.id = n.subtopic_id
       WHERE n.title ILIKE ? 
          OR n.content ILIKE ? 
          OR t.name ILIKE ?
          OR s.title ILIKE ?
          OR tp.title ILIKE ?
          OR st.title ILIKE ?`,
      [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Favorites and Recent APIs
// ==========================================
app.get('/api/notes-special/favorites', async (req, res) => {
  try {
    const favorites = await dbAll('SELECT id, title, updated_at FROM notes WHERE is_favorite = 1 OR is_pinned = 1 ORDER BY updated_at DESC');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes-special/recent', async (req, res) => {
  try {
    const recents = await dbAll(
      `SELECT n.id, n.title, r.opened_at 
       FROM recent_notes r
       JOIN notes n ON n.id = r.note_id
       ORDER BY r.opened_at DESC
       LIMIT 10`
    );
    res.json(recents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. Tags management API
// ==========================================
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await dbAll('SELECT * FROM tags ORDER BY name ASC');
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes/:id/tags', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name is required.' });

  const cleanedName = name.trim().toLowerCase();
  try {
    // Check/create tag
    await dbRun('INSERT INTO tags (name) VALUES (?) ON CONFLICT (name) DO NOTHING', [cleanedName]);
    const tag = await dbGet('SELECT id FROM tags WHERE name = ?', [cleanedName]);

    // Link tag to note
    await dbRun('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?) ON CONFLICT (note_id, tag_id) DO NOTHING', [id, tag.id]);
    res.status(201).json({ id: tag.id, name: cleanedName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id/tags/:tagId', async (req, res) => {
  const { id, tagId } = req.params;
  try {
    await dbRun('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?', [id, tagId]);
    res.json({ success: true, message: 'Tag unlinked.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. Revisions (Version History) API
// ==========================================
app.get('/api/notes/:id/versions', async (req, res) => {
  const { id } = req.params;
  try {
    const versions = await dbAll('SELECT id, created_at, LENGTH(content) as length FROM note_versions WHERE note_id = ? ORDER BY id DESC', [id]);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:id/versions/:versionId', async (req, res) => {
  const { versionId } = req.params;
  try {
    const ver = await dbGet('SELECT * FROM note_versions WHERE id = ?', [versionId]);
    if (!ver) return res.status(404).json({ error: 'Version not found.' });
    res.json(ver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes/:id/versions/:versionId/restore', async (req, res) => {
  const { id, versionId } = req.params;
  try {
    const ver = await dbGet('SELECT content FROM note_versions WHERE id = ? AND note_id = ?', [versionId, id]);
    if (!ver) return res.status(404).json({ error: 'Version content not found for this note.' });

    // Update main note content
    await dbRun('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ver.content, id]);
    // Save a new revision record as the restored content
    await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [id, ver.content]);

    res.json({ success: true, content: ver.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. Image Upload API
// ==========================================
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// ==========================================
// 11. Import & Export API
// ==========================================
// Import raw Markdown file
app.post('/api/import-markdown', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No markdown file uploaded.' });
  const { subject_id, topic_id, subtopic_id } = req.body;
  if (!subject_id || !topic_id) {
    return res.status(400).json({ error: 'Subject ID and Topic ID are required to import notes.' });
  }
  
  try {
    const mdContent = fs.readFileSync(req.file.path, 'utf8');
    const noteTitle = req.file.originalname.replace(/\.[^/.]+$/, ""); // Strip file extension

    const result = await dbRun(
      'INSERT INTO notes (subject_id, topic_id, subtopic_id, title, content) VALUES (?, ?, ?, ?, ?)',
      [subject_id, topic_id, subtopic_id || null, noteTitle, mdContent]
    );

    const noteId = result.lastID;
    await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [noteId, mdContent]);

    // Cleanup uploaded file from tmp path since we read and stored in SQLite
    fs.unlinkSync(req.file.path);

    res.status(201).json({ id: noteId, title: noteTitle, message: 'Markdown imported successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export note as raw Markdown or JSON file
app.get('/api/notes/:id/export/:format', async (req, res) => {
  const { id, format } = req.params;
  try {
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    if (format === 'markdown' || format === 'md') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/\s+/g, '_')}.md"`);
      return res.send(note.content);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/\s+/g, '_')}.json"`);
      return res.json(note);
    } else {
      res.status(400).json({ error: 'Unsupported export format. Use md or json.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. Serve Compiled Frontend Assets
// ==========================================
const frontendDist = join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(join(frontendDist, 'index.html'));
  });
}

// Start Express Listener
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`   NEURONOTES SECURE VAULT ENGINE STARTED          `);
  console.log(`   GATEWAY: http://localhost:${PORT}               `);
  console.log(`===================================================`);
});
