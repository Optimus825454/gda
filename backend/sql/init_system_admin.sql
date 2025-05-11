-- SYSTEM_ADMIN rolünü oluştur
INSERT INTO roles (name, description, created_at, updated_at)
SELECT 
    'SYSTEM_ADMIN',
    'Sistem yöneticisi rolü - tüm yetkilere sahiptir',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'SYSTEM_ADMIN'
);

-- Tüm yetkileri SYSTEM_ADMIN rolüne ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SYSTEM_ADMIN'
AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.role_id = r.id 
    AND rp.permission_id = p.id
);

-- Örnek bir SYSTEM_ADMIN kullanıcısı oluştur (şifre: Admin123!)
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
)
VALUES (
    'admin@example.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Kullanıcı profilini oluştur
INSERT INTO users (
    id,
    email,
    name,
    surname,
    status,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    'System',
    'Administrator',
    'active',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (email) DO NOTHING;

-- SYSTEM_ADMIN rolünü mevcut kullanıcıya ata
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id as user_id,
    r.id as role_id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'ikinciyenikitap54@gmail.com'
AND r.name = 'SYSTEM_ADMIN'
AND NOT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = u.id 
    AND ur.role_id = r.id
); 