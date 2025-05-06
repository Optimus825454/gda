-- Tablo varlığını kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) as roles_table_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'permissions'
) as permissions_table_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'role_permissions'
) as role_permissions_table_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
) as user_roles_table_exists;

-- Tablo yapılarını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
ORDER BY table_name, ordinal_position;

-- Mevcut rolleri kontrol et
SELECT * FROM roles;

-- Mevcut yetkileri kontrol et
SELECT * FROM permissions;

-- Mevcut rol-yetki ilişkilerini kontrol et
SELECT 
    r.name as role_name,
    p.name as permission_name
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id;

-- Mevcut kullanıcı-rol ilişkilerini kontrol et
SELECT 
    u.email,
    r.name as role_name
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'ikinciyenikitap54@gmail.com'; 