-- =============================================
-- 1. BASE TABLES (Departments & Users)
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

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

-- =============================================
-- 2. RESOURCES & RATINGS
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    uploader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_hash TEXT, -- Added for duplicate prevention
    status TEXT DEFAULT 'pending',
    download_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_ratings (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
    UNIQUE(resource_id, user_id)
);

-- =============================================
-- 3. THE HUB (Resource Requests) - FORCE UPDATE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FORCE ADD MISSING COLUMNS (This is the permanent fix)
ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS is_fulfilled BOOLEAN DEFAULT false;
ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS fulfilled_by INTEGER;
ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP;

-- FORCE ADD FOREIGN KEY (Linked to Users)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fulfilled_by') THEN
        ALTER TABLE resource_requests 
        ADD CONSTRAINT fk_fulfilled_by 
        FOREIGN KEY (fulfilled_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================
-- 4. DELETION LOGIC
-- =============================================
CREATE TABLE IF NOT EXISTS deletion_requests (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. SEED DATA
-- =============================================
INSERT INTO departments (name) VALUES 
('Computer Science'), ('Law'), ('Medicine'), ('Business Administration'), ('General Studies'), ('Engineering')
ON CONFLICT (name) DO NOTHING;

-- Final Verification Check
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resource_requests' 
AND column_name IN ('is_fulfilled', 'fulfilled_by', 'fulfilled_at');