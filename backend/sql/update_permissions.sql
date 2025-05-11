-- Eksik yetkileri ekle
INSERT INTO permissions (name, code, description)
VALUES 
    ('Kullanıcı Okuma', 'USER_READ', 'Kullanıcı bilgilerini görüntüleme yetkisi'),
    ('Kullanıcı Oluşturma', 'USER_CREATE', 'Yeni kullanıcı oluşturma yetkisi'),
    ('Kullanıcı Güncelleme', 'USER_UPDATE', 'Kullanıcı bilgilerini güncelleme yetkisi'),
    ('Kullanıcı Silme', 'USER_DELETE', 'Kullanıcı silme yetkisi'),
    ('Rol Yönetimi', 'ROLE_MANAGE', 'Rol atama ve kaldırma yetkisi'),
    ('Kullanıcı Yönetimi', 'MANAGE_USERS', 'Genel kullanıcı yönetimi yetkisi')
ON CONFLICT (code) DO NOTHING;

-- SYSTEM_ADMIN rolüne eksik yetkileri ekle
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SYSTEM_ADMIN'
AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.role_id = r.id 
    AND rp.permission_id = p.id
); 