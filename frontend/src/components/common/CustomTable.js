import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';

/**
 * Özelleştirilmiş tablo bileşeni - Tüm rapor sayfalarında kullanılabilir
 * @param {Object} props - Bileşen özellikleri
 * @param {Array} props.columns - Tablo sütunları [{id, label, minWidth, format, sortable}]
 * @param {Array} props.rows - Tablo satırları
 * @param {boolean} props.loading - Yükleniyor durumu
 * @param {boolean} props.showAllRecords - Tüm kayıtları gösterme durumu
 * @param {boolean} props.disableSorting - Sıralama özelliği devre dışı bırakma
 * @param {number} props.defaultPageSize - Varsayılan sayfa boyutu (50)
 * @param {string} props.defaultSortBy - Varsayılan sıralama sütunu
 * @param {string} props.defaultSortOrder - Varsayılan sıralama yönü ('asc' veya 'desc')
 * @param {string} props.emptyMessage - Veri yoksa gösterilecek mesaj
 * @returns {JSX.Element} Tablo bileşeni
 */
const CustomTable = ({
  columns = [],
  rows = [],
  loading = false,
  showAllRecords = false,
  disableSorting = false,
  defaultPageSize = 50,
  defaultSortBy = '',
  defaultSortOrder = 'asc',
  emptyMessage = 'Veri bulunamadı',
  paperSx = {}
}) => {
  // Sayfalama state'i
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  
  // Sıralama state'i
  const [orderBy, setOrderBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultSortOrder);

  // Sayfa değişikliği
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Sayfa başına gösterilen satır sayısı değişikliği
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sıralama işlevi
  const handleRequestSort = (property) => {
    if (disableSorting) return;
    
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Veriyi sırala
  const sortedRows = React.useMemo(() => {
    if (!orderBy || rows.length === 0) return rows;
    
    return [...rows].sort((a, b) => {
      const column = columns.find(col => col.id === orderBy);
      
      // Özel formatlama fonksiyonu varsa ve getValue özelliği tanımlanmışsa
      if (column?.getValue) {
        const valueA = column.getValue(a);
        const valueB = column.getValue(b);
        
        // Tarih kontrolü
        if (valueA instanceof Date && valueB instanceof Date) {
          return (order === 'asc' ? 1 : -1) * (valueA - valueB);
        }
        
        // String veya diğer değerler için
        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
      }
      
      // Tarih sütunları için özel sıralama
      if (column?.type === 'date') {
        const dateA = a[orderBy] ? new Date(a[orderBy]) : null;
        const dateB = b[orderBy] ? new Date(b[orderBy]) : null;
        
        // Null kontrolleri
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return (order === 'asc' ? 1 : -1) * (dateA - dateB);
      }
      
      // Sayı sütunları için özel sıralama
      if (column?.type === 'number') {
        const numA = parseFloat(a[orderBy]) || 0;
        const numB = parseFloat(b[orderBy]) || 0;
        return (order === 'asc' ? 1 : -1) * (numA - numB);
      }
      
      // Diğer alanlar için normal sıralama
      const valueA = a[orderBy] || '';
      const valueB = b[orderBy] || '';
      
      // Metinsel karşılaştırma için lokale özgü karşılaştırma
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return (order === 'asc' ? 1 : -1) * valueA.localeCompare(valueB, 'tr');
      }
      
      return (valueA < valueB ? -1 : 1) * (order === 'asc' ? 1 : -1);
    });
  }, [rows, orderBy, order, columns]);

  // Görünen satırları filtreleme (sayfalama için)
  const visibleRows = showAllRecords
    ? sortedRows
    : sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden', ...paperSx }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Veriler yükleniyor...
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 550 }}>
            <Table stickyHeader aria-label="veri tablosu">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      style={{ 
                        minWidth: column.minWidth, 
                        fontWeight: 'bold', 
                        backgroundColor: '#f5f5f5' 
                      }}
                    >
                      {!disableSorting && column.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((row, rowIndex) => (
                    <TableRow
                      hover
                      tabIndex={-1}
                      key={row.id || rowIndex}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {columns.map((column) => {
                        let value = row[column.id];
                        
                        // Özel değerler için
                        if (column.getValue) {
                          value = column.getValue(row);
                        }
                        
                        // Formatlama uygula
                        if (column.format) {
                          value = column.format(value, row);
                        }
                        
                        return (
                          <TableCell 
                            key={column.id} 
                            align={column.align || 'left'}
                            sx={column.cellSx}
                          >
                            {value !== null && value !== undefined ? value : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!showAllRecords && (
            <TablePagination
              rowsPerPageOptions={[25, 50, 100, 500]}
              component="div"
              count={sortedRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Sayfa başına satır:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          )}
        </>
      )}
    </Paper>
  );
};

export default CustomTable; 