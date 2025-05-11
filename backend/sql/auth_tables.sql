-- MySQL kimlik doğrulama tabloları

-- Roller tablosu
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kullanıcı-Rol ilişkisi tablosu
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, role_id)
);

-- Menü öğeleri tablosu
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    icon VARCHAR(50),
    parent_id INT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- İzinler tablosu
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rol-İzin ilişkisi tablosu
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY (role_id, permission_id)
);

-- Menü-Rol ilişkisi tablosu
CREATE TABLE IF NOT EXISTS menu_role_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    role_id INT NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY (menu_id, role_id)
);

-- Varsayılan rolleri ekle
INSERT INTO roles (name, description) VALUES 
('SYSTEM_ADMIN', 'Sistem Yöneticisi - Tam yetki sahibi'),
('GULVET_ADMIN', 'GULVET Yöneticisi'),
('ASYAET_ADMIN', 'ASYAET Yöneticisi'),
('DIMES_ADMIN', 'DIMES Yöneticisi');

-- Varsayılan izinleri ekle
INSERT INTO permissions (name, description) VALUES
('MANAGE_USERS', 'Kullanıcı ekleme, silme, düzenleme'),
('MANAGE_ROLES', 'Rol ekleme, silme, düzenleme'),
('MANAGE_PERMISSIONS', 'İzin ekleme, silme, düzenleme'),
('MANAGE_MENU', 'Menü yönetimi'),
('VIEW_DASHBOARD', 'Kontrol panelini görüntüleme'),
('MANAGE_ANIMALS', 'Hayvan kayıtlarını yönetme'),
('VIEW_REPORTS', 'Raporları görüntüleme'),
('EXPORT_DATA', 'Veri dışa aktarma'),
('IMPORT_DATA', 'Veri içe aktarma');

-- System Admin rolüne tüm izinleri ver
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'SYSTEM_ADMIN'),
    id
FROM permissions;

-- Diğer rollere temel izinleri ver
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'GULVET_ADMIN'),
    id
FROM permissions 
WHERE name IN ('VIEW_DASHBOARD', 'MANAGE_ANIMALS', 'VIEW_REPORTS', 'EXPORT_DATA', 'IMPORT_DATA');

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'ASYAET_ADMIN'),
    id
FROM permissions 
WHERE name IN ('VIEW_DASHBOARD', 'MANAGE_ANIMALS', 'VIEW_REPORTS', 'EXPORT_DATA', 'IMPORT_DATA');

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'DIMES_ADMIN'),
    id
FROM permissions 
WHERE name IN ('VIEW_DASHBOARD', 'MANAGE_ANIMALS', 'VIEW_REPORTS', 'EXPORT_DATA', 'IMPORT_DATA');

-- Varsayılan admin kullanıcısı oluştur (şifre: admin123)
INSERT INTO users (username, email, password, full_name, is_active)
VALUES ('admin', 'admin@example.com', '$2b$10$mLpEH.rH9T/CymmnCdkQUedSlQL.kuXX6KkTzBLC7sLF/oiVJZXki', 'Sistem Yöneticisi', TRUE);

-- Admin kullanıcısına SYSTEM_ADMIN rolü ver
INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM roles WHERE name = 'SYSTEM_ADMIN')
);

-- Örnek menü öğeleri ekle
INSERT INTO menu_items (name, url, icon, parent_id, order_index) VALUES
('Kontrol Paneli', '/dashboard', 'dashboard', NULL, 1),
('Hayvanlar', '/animals', 'pets', NULL, 2),
('Sağlık', '/health', 'healing', NULL, 3),
('Raporlar', '/reports', 'assessment', NULL, 4),
('Yönetim', '/admin', 'settings', NULL, 5),
('Kullanıcılar', '/admin/users', 'people', 5, 1),
('Roller', '/admin/roles', 'assignment_ind', 5, 2),
('İzinler', '/admin/permissions', 'security', 5, 3),
('Menü Yönetimi', '/admin/menu', 'menu', 5, 4);

-- Menü erişim izinleri - SYSTEM_ADMIN tüm menülere erişebilir
INSERT INTO menu_role_access (menu_id, role_id, can_view)
SELECT 
    mi.id,
    (SELECT id FROM roles WHERE name = 'SYSTEM_ADMIN'),
    TRUE
FROM menu_items mi;

-- GULVET_ADMIN, ASYAET_ADMIN, DIMES_ADMIN için menü erişimleri
INSERT INTO menu_role_access (menu_id, role_id, can_view)
SELECT 
    mi.id,
    r.id,
    CASE 
        WHEN mi.name IN ('Yönetim', 'Kullanıcılar', 'Roller', 'İzinler', 'Menü Yönetimi') THEN FALSE
        ELSE TRUE
    END
FROM menu_items mi
CROSS JOIN roles r
WHERE r.name IN ('GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'); 