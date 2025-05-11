-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL DEFAULT 'USER'
);

-- Örnek kullanıcı ekle (şifre: 123456)
INSERT INTO users (username, email, password, full_name, role) 
VALUES 
('admin', 'admin@example.com', '123456', 'Admin User', 'ADMIN'),
('user', 'user@example.com', '123456', 'Normal User', 'USER')
ON DUPLICATE KEY UPDATE 
username=VALUES(username),
email=VALUES(email), 
password=VALUES(password), 
full_name=VALUES(full_name), 
role=VALUES(role); 