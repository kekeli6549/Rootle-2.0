-- 0. Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACULTIES
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- FIXED: Removed the 'at'
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    department_id UUID REFERENCES departments(id),
    student_id VARCHAR(50),
    staff_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESOURCES 
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Notes',
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100), -- Increased length for safety
    file_hash TEXT UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SEED DATA (Run this so the app has data to display)
INSERT INTO faculties (name) VALUES ('Faculty of Physical Sciences') ON CONFLICT DO NOTHING;
INSERT INTO departments (faculty_id, name) VALUES 
((SELECT id FROM faculties WHERE name = 'Faculty of Physical Sciences'), 'Computer Science')
ON CONFLICT DO NOTHING;


-- 1. Add the hidden flag to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN DEFAULT false;

-- 2. Create the Deletion Requests table (The message center for Admins)
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);