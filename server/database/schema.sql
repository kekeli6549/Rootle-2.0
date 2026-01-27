-- Create UUID extension (for unique IDs that aren't just 1, 2, 3)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACULTIES TABLE
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student', -- student, lecturer, admin
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESOURCES TABLE
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL, -- Path to the file
    file_type VARCHAR(20),  -- pdf, docx, etc.
    file_hash TEXT UNIQUE NOT NULL, -- The "Fingerprint"
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, flagged
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);