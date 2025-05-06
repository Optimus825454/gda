/**
 * UserController.js - Kullanıcı yönetimi controller
 */

const { supabaseAdmin } = require('../config/supabase');

class UserController {
    /**
     * Tüm kullanıcıları listele
     */
    async listUsers(req, res) {
        try {
            // Önce kullanıcıları al
            const { data: users, error: usersError } = await supabaseAdmin
                .from('users')
                .select('*');

            if (usersError) throw usersError;

            // Her kullanıcı için rolleri al
            const usersWithRoles = await Promise.all(users.map(async (user) => {
                const { data: roles, error: rolesError } = await supabaseAdmin
                    .from('user_roles')
                    .select(`
                        role:roles (
                            id,
                            name,
                            permissions:role_permissions (
                                permission:permissions (
                                    id,
                                    name,
                                    code
                                )
                            )
                        )
                    `)
                    .eq('user_id', user.id);

                if (rolesError) throw rolesError;

                return {
                    ...user,
                    roles: roles?.map(r => r.role) || []
                };
            }));

            res.json({
                success: true,
                data: usersWithRoles
            });
        } catch (error) {
            console.error('Kullanıcıları listelerken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcılar listelenirken bir hata oluştu'
            });
        }
    }

    /**
     * ID'ye göre kullanıcı detaylarını getir
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const { data: user, error } = await supabaseAdmin
                .from('users')
                .select(`
                    *,
                    user_roles (
                        roles (
                            name,
                            permissions (
                                name,
                                code
                            )
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Kullanıcı bulunamadı'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Kullanıcı detayı alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı detayı alınırken bir hata oluştu'
            });
        }
    }

    /**
     * Yeni kullanıcı oluştur
     */
    async createUser(req, res) {
        try {
            const { email, password, name, surname, phone, role_ids } = req.body;

            // Kullanıcıyı oluştur
            const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (userError) throw userError;

            // Kullanıcı profilini oluştur
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('users')
                .insert([{
                    id: newUser.user.id,
                    email,
                    name,
                    surname,
                    phone,
                    status: 'active'
                }])
                .select()
                .single();

            if (profileError) throw profileError;

            // Kullanıcı rollerini ata
            if (role_ids && role_ids.length > 0) {
                const userRoles = role_ids.map(role_id => ({
                    user_id: newUser.user.id,
                    role_id
                }));

                const { error: roleError } = await supabaseAdmin
                    .from('user_roles')
                    .insert(userRoles);

                if (roleError) throw roleError;
            }

            res.status(201).json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Kullanıcı oluşturulurken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı oluşturulurken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcı bilgilerini güncelle
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, surname, phone, status } = req.body;

            const { data: user, error } = await supabaseAdmin
                .from('users')
                .update({
                    name,
                    surname,
                    phone,
                    status,
                    updated_at: new Date()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Kullanıcı güncellenirken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı güncellenirken bir hata oluştu'
            });
        }
    }

    /**
     * Şifre değiştir
     */
    async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;

            const { error } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                { password }
            );

            if (error) throw error;

            res.json({
                success: true,
                message: 'Şifre başarıyla güncellendi'
            });
        } catch (error) {
            console.error('Şifre değiştirilirken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Şifre değiştirilirken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcı durumunu (aktif/pasif) değiştir
     */
    async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const { data: user, error } = await supabaseAdmin
                .from('users')
                .update({
                    status,
                    updated_at: new Date()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Kullanıcı durumu değiştirilirken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı durumu değiştirilirken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcıyı sil
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Önce kullanıcı rollerini sil
            const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .delete()
                .eq('user_id', id);

            if (roleError) throw roleError;

            // Kullanıcı profilini sil
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', id);

            if (profileError) throw profileError;

            // Auth kullanıcısını sil
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

            if (authError) throw authError;

            res.json({
                success: true,
                message: 'Kullanıcı başarıyla silindi'
            });
        } catch (error) {
            console.error('Kullanıcı silinirken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı silinirken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcının işlem loglarını getir
     */
    async getUserLogs(req, res) {
        try {
            const { id } = req.params;
            const { data: logs, error } = await supabaseAdmin
                .from('user_logs')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Kullanıcı logları alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Kullanıcı logları alınırken bir hata oluştu'
            });
        }
    }

    /**
     * Tüm kullanıcıların işlem loglarını getir (sadece yöneticiler için)
     */
    async getAllLogs(req, res) {
        try {
            const { data: logs, error } = await supabaseAdmin
                .from('user_logs')
                .select(`
                    *,
                    users (
                        name,
                        surname,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Tüm loglar alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Tüm loglar alınırken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcıya rol ata
     */
    async assignRole(req, res) {
        try {
            const { user_id, role_id } = req.body;

            // Önce mevcut rolü kontrol et
            const { data: existingRole } = await supabaseAdmin
                .from('user_roles')
                .select('*')
                .eq('user_id', user_id)
                .eq('role_id', role_id)
                .single();

            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    error: 'Bu rol zaten kullanıcıya atanmış'
                });
            }

            // Yeni rolü ata
            const { error } = await supabaseAdmin
                .from('user_roles')
                .insert([{
                    user_id,
                    role_id,
                    created_at: new Date(),
                    updated_at: new Date()
                }]);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rol başarıyla atandı'
            });
        } catch (error) {
            console.error('Rol atama hatası:', error);
            res.status(500).json({
                success: false,
                error: 'Rol atanırken bir hata oluştu'
            });
        }
    }

    /**
     * Kullanıcıdan rol kaldır
     */
    async removeRole(req, res) {
        try {
            const { user_id, role_id } = req.body;

            // SYSTEM_ADMIN rolünü kaldırmaya çalışıyorsa engelle
            const { data: role } = await supabaseAdmin
                .from('roles')
                .select('name')
                .eq('id', role_id)
                .single();

            if (role?.name === 'SYSTEM_ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'SYSTEM_ADMIN rolü kaldırılamaz'
                });
            }

            const { error } = await supabaseAdmin
                .from('user_roles')
                .delete()
                .eq('user_id', user_id)
                .eq('role_id', role_id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rol başarıyla kaldırıldı'
            });
        } catch (error) {
            console.error('Rol kaldırma hatası:', error);
            res.status(500).json({
                success: false,
                error: 'Rol kaldırılırken bir hata oluştu'
            });
        }
    }
}

module.exports = new UserController();
