-- Create UUID extension (Crucial for our ID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACULTIES TABLE
-- The high-level academic groups
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
-- Linked to faculties; users and resources are tagged here
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS TABLE
-- Consolidated with student/staff IDs for university verification
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student', -- student, lecturer, or admin
    department_id UUID REFERENCES departments(id),
    student_id VARCHAR(50), -- Only populated if role is student
    staff_id VARCHAR(50),   -- Only populated if role is lecturer/admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESOURCES TABLE
-- The heart of the library; includes heat/download tracking
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Notes', -- Notes, Past Questions, Research, Textbooks
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_hash TEXT UNIQUE NOT NULL, -- Prevents duplicate uploads of the same file
    download_count INTEGER DEFAULT 0, -- Used for the "Trending" logic
    status VARCHAR(20) DEFAULT 'pending', -- for Admin approval flow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. INITIAL SEED DATA (So your registration works immediately)
-- Run these so the 'Department' dropdown in your UI has a match in the DB
INSERT INTO faculties (id, name) VALUES 
(uuid_generate_v4(), 'Faculty of Physical Sciences'),
(uuid_generate_v4(), 'Faculty of Engineering');

INSERT INTO departments (faculty_id, name) VALUES 
((SELECT id FROM faculties WHERE name = 'Faculty of Physical Sciences'), 'Computer Science'),
((SELECT id FROM faculties WHERE name = 'Faculty of Engineering'), 'Engineering');