import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { withPermission } from '../../components/auth/withPermission';
import { 
    DataGrid, 
    GridToolbar,
    trTR 
} from '@mui/x-data-grid';
import { 
    Box, 
    Button, 
    IconButton, 
    Chip, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Typography,
    Paper,
    Container,
    Grid,
    Card,
    CardContent,
    Divider,
    Stack,
    Alert
} from '@mui/material';

// Yeni Kullanıcı Ekleme Dialog'u
const AddUserDialog = ({ open, onClose, roles, onSubmit }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        firstName: '',
        lastName: '',
        role: '', // Rol adı veya ID'si
    });
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        
        if (!formData.email) errors.email = "E-posta alanı zorunludur";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Geçerli bir e-posta adresi giriniz";
        
        if (!formData.password) errors.password = "Şifre alanı zorunludur";
        else if (formData.password.length < 6) errors.password = "Şifre en az 6 karakter olmalıdır";
        
        if (!formData.username) errors.username = "Kullanıcı adı zorunludur";
        
        if (!formData.role) errors.role = "Rol seçimi zorunludur";
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setError(null);
        try {
            const result = await onSubmit(formData);
            if (!result.success) {
                setError(result.error || 'Kullanıcı oluşturulamadı');
            } else {
                // Formu sıfırla ve kapat
                setFormData({
                    email: '',
                    password: '',
                    username: '',
                    firstName: '',
                    lastName: '',
                    role: '',
                });
                onClose();
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                <Stack spacing={2} mt={2}>
                    <TextField
                        fullWidth
                        label="E-posta"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!validationErrors.email}
                        helperText={validationErrors.email}
                    />
                    <TextField
                        fullWidth
                        label="Şifre"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!validationErrors.password}
                        helperText={validationErrors.password}
                    />
                    <TextField
                        fullWidth
                        label="Kullanıcı Adı"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        error={!!validationErrors.username}
                        helperText={validationErrors.username}
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Ad"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Soyad"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                    <FormControl fullWidth error={!!validationErrors.role}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label="Rol"
                        >
                            <MenuItem value="">
                                <em>Seçiniz</em>
                            </MenuItem>
                            {roles.map(role => (
                                <MenuItem key={role.id || role.name} value={role.name}>
                                    {role.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {validationErrors.role && (
                            <FormHelperText>{validationErrors.role}</FormHelperText>
                        )}
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>İptal</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                >
                    Kullanıcı Ekle
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Kullanıcı Düzenleme Dialog'u
const EditUserDialog = ({ open, onClose, user, roles, onSubmit }) => {
    const [formData, setFormData] = useState({
        role: user?.profile?.role || user?.roles?.[0]?.name || '',
        active: user?.status === 'active' || !!user?.email_confirmed_at
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                role: user.profile?.role || user.roles?.[0]?.name || '',
                active: user.status === 'active' || !!user.email_confirmed_at
            });
        }
    }, [user]);

    const handleRoleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            role: e.target.value
        }));
    };

    const handleSubmit = async () => {
        setError(null);
        try {
            const updateData = { role: formData.role };
            const result = await onSubmit(user.id, updateData);
            if (!result.success) {
                setError(result.error || 'Kullanıcı güncellenemedi');
            } else {
                onClose();
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Kullanıcı Düzenle: {user.profile?.username || user.username || user.email}</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                <Stack spacing={2} mt={2}>
                    <FormControl fullWidth>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={formData.role}
                            onChange={handleRoleChange}
                            label="Rol"
                        >
                            <MenuItem value="">
                                <em>Seçiniz</em>
                            </MenuItem>
                            {roles.map(role => (
                                <MenuItem key={role.id || role.name} value={role.name}>
                                    {role.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>İptal</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                >
                    Kaydet
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Kullanıcı Silme Onay Dialog'u
const DeleteConfirmDialog = ({ open, onClose, user, onConfirm }) => {
    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Kullanıcı Silme Onayı</DialogTitle>
            <DialogContent>
                <Typography>
                    <b>{user.profile?.username || user.username || user.email}</b> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>İptal</Button>
                <Button 
                    onClick={() => onConfirm(user.id)} 
                    variant="contained" 
                    color="error"
                >
                    Sil
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Kişisel Bilgiler ve İstatistikler Kartları
const UserStats = ({ users }) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active' || user.email_confirmed_at).length;
    const pendingUsers = users.filter(user => !user.email_confirmed_at).length;

    // Rol bazlı kullanıcı sayıları
    const roleStats = {};
    users.forEach(user => {
        const roleName = user.roles?.[0]?.name || user.profile?.role || 'Belirsiz';
        if (!roleStats[roleName]) {
            roleStats[roleName] = 0;
        }
        roleStats[roleName]++;
    });

    return (
        <Box mb={4}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
                        color: 'white' 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Toplam Kullanıcı</Typography>
                            <Typography variant="h3">{totalUsers}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
                        color: 'white' 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Aktif Kullanıcı</Typography>
                            <Typography variant="h3">{activeUsers}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
                        color: 'white' 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Onay Bekleyen</Typography>
                            <Typography variant="h3">{pendingUsers}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
                        color: 'white' 
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Rol Dağılımı</Typography>
                            <Box>
                                {Object.entries(roleStats).map(([role, count]) => (
                                    <Chip 
                                        key={role}
                                        label={`${role}: ${count}`}
                                        size="small"
                                        sx={{ mr: 1, mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

function UserManagement() {
    const { users, loading, error, createUser, updateUser, deleteUser } = useUser();
    const { roles, loading: roleLoading } = useRole();
    const { user: currentUser } = useAuth();
    
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    // Kullanıcı oluşturma işlemi
    const handleCreateUser = async (userData) => {
        return await createUser(userData);
    };

    // Kullanıcı güncelleme işlemi
    const handleUpdateUser = async (userId, updateData) => {
        return await updateUser(userId, updateData);
    };

    // Kullanıcı silme işlemi
    const handleDeleteUser = async (userId) => {
        await deleteUser(userId);
        setDeleteDialogOpen(false);
    };

    // Kullanıcıları düzenleme modalı açma
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    // Kullanıcı silme onayı modalı açma
    const handleDeleteConfirm = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    // DataGrid sütunları
    const columns = [
        { 
            field: 'username', 
            headerName: 'Kullanıcı Adı', 
            width: 180,
            valueGetter: (params) => params.row.profile?.username || params.row.username || '-'
        },
        { 
            field: 'email', 
            headerName: 'E-posta', 
            width: 220 
        },
        { 
            field: 'fullName', 
            headerName: 'Ad Soyad', 
            width: 180,
            valueGetter: (params) => {
                const firstName = params.row.profile?.first_name || params.row.firstName || '';
                const lastName = params.row.profile?.last_name || params.row.lastName || '';
                return `${firstName} ${lastName}`.trim() || '-';
            }
        },
        { 
            field: 'role', 
            headerName: 'Rol', 
            width: 150,
            valueGetter: (params) => {
                if (params.row.roles && params.row.roles.length > 0) {
                    return params.row.roles.map(role => role.name).join(', ');
                }
                return params.row.profile?.role || '-';
            },
            renderCell: (params) => {
                const roleName = params.value;
                let color = 'primary';
                
                // Rol bazlı renk ataması
                if (roleName.includes('Admin')) color = 'error';
                else if (roleName.includes('Yönetici')) color = 'warning';
                
                return <Chip label={roleName} color={color} size="small" />;
            }
        },
        { 
            field: 'status', 
            headerName: 'Durum', 
            width: 130,
            valueGetter: (params) => {
                return params.row.email_confirmed_at ? 'Aktif' : 'Onay Bekliyor';
            },
            renderCell: (params) => {
                const status = params.value;
                const color = status === 'Aktif' ? 'success' : 'warning';
                return <Chip label={status} color={color} size="small" />;
            }
        },
        { 
            field: 'createdAt', 
            headerName: 'Kayıt Tarihi', 
            width: 170,
            valueGetter: (params) => {
                if (!params.row.createdAt) return '-';
                const date = new Date(params.row.createdAt);
                return new Intl.DateTimeFormat('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
            }
        },
        { 
            field: 'actions', 
            headerName: 'İşlemler', 
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                // Kullanıcı kendisini düzenleyemez/silemez
                const isSelf = currentUser?.id === params.row.id;
                
                return (
                    <Box>
                        <Button 
                            variant="text" 
                            color="primary" 
                            size="small" 
                            onClick={() => handleEditUser(params.row)}
                            disabled={isSelf}
                        >
                            Düzenle
                        </Button>
                        <Button 
                            variant="text" 
                            color="error" 
                            size="small" 
                            onClick={() => handleDeleteConfirm(params.row)}
                            disabled={isSelf}
                        >
                            Sil
                        </Button>
                    </Box>
                );
            }
        },
    ];

    const isLoading = loading || roleLoading;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" color="white" gutterBottom>
                        Kullanıcı Yönetimi
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => setAddDialogOpen(true)}
                    >
                        Yeni Kullanıcı Ekle
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                )}

                {/* İstatistik Kartları */}
                <UserStats users={users} />

                {/* Kullanıcı Tablosu */}
                <Box sx={{ height: 600, bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize },
                            },
                        }}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        onPageSizeChange={setPageSize}
                        disableRowSelectionOnClick
                        loading={isLoading}
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 500 },
                            },
                        }}
                        localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-root': {
                                backgroundColor: 'rgb(31, 41, 55)',
                                color: 'rgb(209, 213, 219)',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'rgb(55, 65, 81)',
                                color: 'rgb(209, 213, 219)',
                            },
                            '& .MuiDataGrid-row': {
                                '&:hover': {
                                    backgroundColor: 'rgb(55, 65, 81)',
                                },
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgb(75, 85, 99)',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '1px solid rgb(75, 85, 99)',
                                backgroundColor: 'rgb(55, 65, 81)',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'rgb(209, 213, 219)',
                            },
                            '& .MuiButton-text': {
                                color: 'rgb(129, 140, 248)',
                            },
                            '& .MuiInputBase-root': {
                                color: 'rgb(209, 213, 219)',
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                backgroundColor: 'rgb(55, 65, 81)',
                                color: 'rgb(209, 213, 219)',
                                borderBottom: '1px solid rgb(75, 85, 99)',
                                padding: '8px',
                            },
                        }}
                    />
                </Box>
            </Paper>

            {/* Modaller */}
            <AddUserDialog 
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                roles={roles}
                onSubmit={handleCreateUser}
            />
            
            <EditUserDialog 
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                user={selectedUser}
                roles={roles}
                onSubmit={handleUpdateUser}
            />
            
            <DeleteConfirmDialog 
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                user={selectedUser}
                onConfirm={handleDeleteUser}
            />
        </Container>
    );
}

// ADMIN rolü olanlar için erişim izni
export default withPermission(UserManagement, 'ADMIN');
