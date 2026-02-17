-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, 
    role VARCHAR(20) DEFAULT 'student',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    student_id VARCHAR(50),
    staff_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RESOURCES (The Vault)
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    uploader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    status TEXT DEFAULT 'pending',
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RESOURCE REQUESTS (The Wishlist/Hub)
CREATE TABLE IF NOT EXISTS resource_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_fulfilled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. REVIEWS (Ratings & Feedback)
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. DELETION LOGIC (Purge Management)
CREATE TABLE IF NOT EXISTS deletion_requests (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SEED DATA & CONSTRAINTS
INSERT INTO departments (name) VALUES 
('Computer Science'), ('Law'), ('Medicine'), ('Business Administration'), ('General Studies'), ('Engineering')
ON CONFLICT (name) DO NOTHING;

-- Final constraint check for the Resources table
ALTER TABLE resources 
DROP CONSTRAINT IF EXISTS resources_department_id_fkey;

INSERT INTO departments (name) VALUES ('Computer Science'), ('Law'), ('Medicine'), ('Business Administration'), ('General Studies'), ('Engineering') ON CONFLICT DO NOTHING;

ALTER TABLE resources 
ADD CONSTRAINT resources_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO departments (name) VALUES 
('Computer Science'), 
('Law'), 
('Medicine'), 
('Business Administration'), 
('General Studies'),
('Engineering');

-- Add hash column to prevent duplicate files
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Track who fulfilled a request in the Hub
ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS fulfilled_by INTEGER REFERENCES users(id);
