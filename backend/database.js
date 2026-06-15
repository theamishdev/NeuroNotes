import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Determine environment
const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || connectionString?.includes('onrender.com') || connectionString?.includes('neon.tech');

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Helper regex to convert SQLite parameter placeholders "?" into PostgreSQL "$1, $2, etc."
export const translateSql = (sql) => {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
};

// SQLite syntax translation wrapper for dbRun (Inserts/Updates/Deletes)
export const dbRun = async (sql, params = []) => {
  let pgSql = translateSql(sql);
  const trimmed = pgSql.trim().toUpperCase();

  // If it's an INSERT query targeting tables with auto-increment IDs,
  // append RETURNING id to capture the generated key
  const tablesWithId = ['subjects', 'topics', 'subtopics', 'notes', 'tags', 'note_versions'];
  const insertMatch = trimmed.match(/INSERT\s+INTO\s+(\w+)/i);
  const tableName = insertMatch ? insertMatch[1].toLowerCase() : '';

  if (trimmed.startsWith('INSERT') && tablesWithId.includes(tableName) && !trimmed.includes('RETURNING')) {
    pgSql += ' RETURNING id';
  }

  const result = await pool.query(pgSql, params);

  return {
    lastID: result.rows[0]?.id || null,
    changes: result.rowCount
  };
};

// SQLite syntax translation wrapper for dbGet (Single Row)
export const dbGet = async (sql, params = []) => {
  const pgSql = translateSql(sql);
  const result = await pool.query(pgSql, params);
  return result.rows[0] || null;
};

// SQLite syntax translation wrapper for dbAll (Multiple Rows)
export const dbAll = async (sql, params = []) => {
  const pgSql = translateSql(sql);
  const result = await pool.query(pgSql, params);
  return result.rows;
};

// Initialize schema
export const initDatabase = async () => {
  try {
    // 1. Subjects
    await dbRun(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Topics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Subtopics
    await dbRun(`
      CREATE TABLE IF NOT EXISTS subtopics (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Notes
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        subtopic_id INTEGER REFERENCES subtopics(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        is_favorite INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Tags
    await dbRun(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);

    // 6. Note Tags
    await dbRun(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_id)
      )
    `);

    // 7. Note Versions (Revision History)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS note_versions (
        id SERIAL PRIMARY KEY,
        note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Recent Notes (Recently Opened tracker)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS recent_notes (
        note_id INTEGER PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('PostgreSQL database tables successfully initialized or checked.');
    await seedInitialData();
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
  }
};

const seedInitialData = async () => {
  // Check if seed has already been run
  const subjectCount = await dbGet('SELECT COUNT(*) as count FROM subjects');
  if (parseInt(subjectCount.count) > 0) {
    console.log('Database already populated. Skipping seeds.');
    return;
  }

  console.log('Seeding initial Cyberpunk knowledge database into PostgreSQL...');

  // Subject 1: Neural Protocols
  const subj1 = await dbRun('INSERT INTO subjects (title) VALUES (?)', ['Neural Protocols']);
  const s1Id = subj1.lastID;

  const topic1_1 = await dbRun('INSERT INTO topics (subject_id, title) VALUES (?, ?)', [s1Id, 'ICEbreaking Algorithms']);
  const t1_1Id = topic1_1.lastID;

  const subtopic1_1_1 = await dbRun('INSERT INTO subtopics (topic_id, title) VALUES (?, ?)', [t1_1Id, 'Sledgehammer Protocol']);
  const sub1_1_1Id = subtopic1_1_1.lastID;

  const note1Content = `# Sledgehammer ICEbreaker Protocol

The **Sledgehammer Protocol** is a brute-force decryption technique designed to overload Intrusion Countermeasure Electronics (ICE) by targeting buffer allocations in subnet gateways.

## Code Demonstration

Below is a Python snippet demonstrating socket flood payloads used to simulate a gate overflow:

\`\`\`python
import socket
import sys

def fire_payload(target_ip, target_port):
    print(f"[\u001b[35mSYSTEM\u001b[0m] Initializing Sledgehammer flow on {target_ip}:{target_port}...")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((target_ip, target_port))
        
        # Cybernetic buffer overload packet
        overflow_buffer = b"X" * 4096 + b"\\xEB\\xFE"
        s.sendall(overflow_buffer)
        
        print("[\u001b[32mSUCCESS\u001b[0m] ICE payload delivered. Check gateway routing table.")
    except Exception as e:
        print(f"[\u001b[31mFAILED\u001b[0m] Gateway rejected packet connection: {e}")
    finally:
        s.close()
\`\`\`

## System Requirements

| Specification | Minimum Target Gate | Recommended Link |
| :--- | :--- | :--- |
| Bandwidth | 100 Gbps Quantum Link | 1 Tbps Tachyonic |
| Sync Buffer | 16 GB Neural RAM | 64 GB Sub-zero RAM |
| Cyberdeck Core | Mil-spec Mk. IV | Custom Daemon Core v9 |

> [!WARNING]
> Running the Sledgehammer protocol without a dampener can lead to **feedback backfire**, exposing your neural processor's physical MAC address. Always verify the active VPN proxy status inside your sub-shell before initializing socket commands.
`;

  const note1 = await dbRun(
    `INSERT INTO notes (subject_id, topic_id, subtopic_id, title, content, is_favorite, is_pinned)
     VALUES (?, ?, ?, ?, ?, 1, 1)`,
    [s1Id, t1_1Id, sub1_1_1Id, 'Brute-force Gate Overload', note1Content]
  );
  
  // Tag seeding
  await dbRun('INSERT INTO tags (name) VALUES (?) ON CONFLICT (name) DO NOTHING', ['cyberdeck']);
  await dbRun('INSERT INTO tags (name) VALUES (?) ON CONFLICT (name) DO NOTHING', ['decryption']);
  await dbRun('INSERT INTO tags (name) VALUES (?) ON CONFLICT (name) DO NOTHING', ['python']);
  
  const tagCyber = await dbGet('SELECT id FROM tags WHERE name = ?', ['cyberdeck']);
  const tagDecrypt = await dbGet('SELECT id FROM tags WHERE name = ?', ['decryption']);
  const tagPython = await dbGet('SELECT id FROM tags WHERE name = ?', ['python']);
  
  await dbRun('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?) ON CONFLICT (note_id, tag_id) DO NOTHING', [note1.lastID, tagCyber.id]);
  await dbRun('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?) ON CONFLICT (note_id, tag_id) DO NOTHING', [note1.lastID, tagDecrypt.id]);
  await dbRun('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?) ON CONFLICT (note_id, tag_id) DO NOTHING', [note1.lastID, tagPython.id]);

  // Insert initial version
  await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [note1.lastID, note1Content]);
  await dbRun('INSERT INTO recent_notes (note_id) VALUES (?)', [note1.lastID]);

  // Subject 2: Netrunning Gear
  const subj2 = await dbRun('INSERT INTO subjects (title) VALUES (?)', ['Netrunning Hardware']);
  const s2Id = subj2.lastID;

  const topic2_1 = await dbRun('INSERT INTO topics (subject_id, title) VALUES (?, ?)', [s2Id, 'Cyberdecks']);
  const t2_1Id = topic2_1.lastID;

  const note2Content = `# Custom Cyberdeck Architecture

An overview of high-end hardware specifications for modern Netrunners:

* **Neural Interfaces**: Direct wetware links that map spinal columns to optical buses.
* **Liquid Coolers**: Active nitrogen micro-channels built inside the cyberdeck jacket to prevent overheating.
* **Firmware**: Custom Linux kernels with the pre-loaded **Netrunner OS** subsystem.

## Build Checklist

1. [x] Acquire military-grade grid chips
2. [x] Solder quantum optic interfaces
3. [ ] Overclock visual overlay processors
4. [ ] Initialize local database vault
`;

  const note2 = await dbRun(
    `INSERT INTO notes (subject_id, topic_id, subtopic_id, title, content, is_favorite, is_pinned)
     VALUES (?, ?, NULL, ?, ?, 0, 0)`,
    [s2Id, t2_1Id, 'Ono-Sendai Cyberspace Specs', note2Content]
  );
  
  await dbRun('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?) ON CONFLICT (note_id, tag_id) DO NOTHING', [note2.lastID, tagCyber.id]);
  await dbRun('INSERT INTO note_versions (note_id, content) VALUES (?, ?)', [note2.lastID, note2Content]);
  await dbRun('INSERT INTO recent_notes (note_id) VALUES (?)', [note2.lastID]);

  console.log('Seed into PostgreSQL completed successfully.');
};

export default pool;
