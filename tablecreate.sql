
-- ==========================================
-- 0. INITIAL SETUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- FACULTIES: The high-level groupings
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEPARTMENTS: Linked to Faculties
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS: Students, Lecturers, and Admins
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student', -- 'student', 'lecturer', 'admin'
    department_id UUID REFERENCES departments(id),
    student_id VARCHAR(50),
    staff_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESOURCES: The heart of the app
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Notes',
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_hash TEXT UNIQUE NOT NULL, -- Prevents duplicate uploads
    download_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved'
    deleted_by_user BOOLEAN DEFAULT false, -- Soft delete flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DELETION REQUESTS: Admin inbox for removals
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. SEED DATA (Critical for Registration)
-- ==========================================

-- First, create the Faculties
INSERT INTO faculties (name) VALUES 
('Faculty of Physical Sciences'),
('Faculty of Engineering'),
('Faculty of Biological Sciences'),
('Faculty of Arts & Humanities')
ON CONFLICT (name) DO NOTHING;

-- Next, create the Departments to match your Register.jsx dropdown
INSERT INTO departments (faculty_id, name) VALUES 
((SELECT id FROM faculties WHERE name = 'Faculty of Physical Sciences'), 'Computer Science'),
((SELECT id FROM faculties WHERE name = 'Faculty of Engineering'), 'Engineering'),
((SELECT id FROM faculties WHERE name = 'Faculty of Biological Sciences'), 'Biological Sciences'),
((SELECT id FROM faculties WHERE name = 'Faculty of Arts & Humanities'), 'Arts & Humanities')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 3. INDEXES FOR SPEED (The Senior Dev Touch)
-- ==========================================
-- These make searching and logging in much faster as your data grows
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);