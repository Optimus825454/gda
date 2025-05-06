const supabase = require('../config/supabase');

class UserModel {
    async getAllUsers() {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                user_roles (
                    roles (
                        role_name,
                        permissions (permission_name)
                    )
                )
            `);
        
        if (error) throw error;
        return data;
    }

    async getUserById(userId) {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                user_roles (
                    roles (
                        role_name,
                        permissions (permission_name)
                    )
                )
            `)
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async updateUser(userId, userData) {
        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', userId)
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async deleteUser(userId) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        return true;
    }

    async assignRole(userId, roleId) {
        const { data, error } = await supabase
            .from('user_roles')
            .insert([{ user_id: userId, role_id: roleId }])
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async removeRole(userId, roleId) {
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role_id', roleId);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new UserModel(); 