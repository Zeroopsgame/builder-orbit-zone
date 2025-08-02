-- Create crew_members table
CREATE TABLE crew_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status ENUM('in', 'out') DEFAULT 'in',
    note TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO crew_members (name, status, note) VALUES 
('John Smith', 'in', NULL),
('Sarah Johnson', 'out', 'Lunch'),
('Mike Davis', 'in', NULL);
