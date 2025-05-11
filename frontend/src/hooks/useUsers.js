import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Token alma fonksiyonu
    const getAuthToken = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session?.access_token;
        } catch (err) {
            console.error('Token alınamadı:', err);
            return null;
        }
    };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getAuthToken();
            if (!token) {
                throw new Error('Oturum bulunamadı');
            }

            const { data } = await axiosInstance.get('/users');
            setUsers(data.data || []);
        } catch (err) {
            console.error('Kullanıcılar yüklenirken hata:', err);
            setError(err.message);
            toast.error('Kullanıcılar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = useCallback(async (userData) => {
        try {
            setLoading(true);
            const { data } = await axiosInstance.post('/users', userData);
            setUsers(prev => [...prev, data.data]);
            toast.success('Kullanıcı başarıyla oluşturuldu');
            return data.data;
        } catch (err) {
            console.error('Kullanıcı oluşturma hatası:', err);
            setError(err.message);
            toast.error('Kullanıcı oluşturulurken bir hata oluştu');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (userId, userData) => {
        try {
            setLoading(true);
            const { data } = await axiosInstance.put(`/users/${userId}`, userData);
            setUsers(prev => prev.map(user => user.id === userId ? data.data : user));
            toast.success('Kullanıcı başarıyla güncellendi');
            return data.data;
        } catch (err) {
            console.error('Kullanıcı güncelleme hatası:', err);
            setError(err.message);
            toast.error('Kullanıcı güncellenirken bir hata oluştu');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = useCallback(async (userId) => {
        try {
            setLoading(true);
            await axiosInstance.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
            toast.success('Kullanıcı başarıyla silindi');
        } catch (err) {
            console.error('Kullanıcı silme hatası:', err);
            setError(err.message);
            toast.error('Kullanıcı silinirken bir hata oluştu');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const assignRole = useCallback(async (userId, roleId) => {
        try {
            setLoading(true);
            await axiosInstance.post('/users/role', { userId, roleId });
            await fetchUsers(); // Kullanıcı listesini yenile
            toast.success('Rol başarıyla atandı');
        } catch (err) {
            console.error('Rol atama hatası:', err);
            setError(err.message);
            toast.error('Rol atanırken bir hata oluştu');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers]);

    const removeRole = useCallback(async (userId, roleId) => {
        try {
            setLoading(true);
            await axiosInstance.delete('/users/role', { 
                data: { userId, roleId } 
            });
            await fetchUsers(); // Kullanıcı listesini yenile
            toast.success('Rol başarıyla kaldırıldı');
        } catch (err) {
            console.error('Rol kaldırma hatası:', err);
            setError(err.message);
            toast.error('Rol kaldırılırken bir hata oluştu');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        assignRole,
        removeRole
    };
}; 