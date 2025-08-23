import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { 
  Box, 
  MenuItem, 
  Select, 
  TextField, 
  Typography, 
  Stack,
  Card,
  Chip,
  InputLabel,
  FormControl
} from '@mui/material';
import { Button } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridCheckCircleIcon, GridCloseIcon, GridDeleteIcon } from '@mui/x-data-grid';
import { ROUTES } from '../../utils/routes';
import { useAuth } from '../utils/auth';
import { sharedStyles, getButtonStyle, getStatusStyle } from '../config/sharedStyles';
const nextNumber = numbers => 1 + numbers?.reduce((a, b) => (a > b ? a : b), 0) || 0
const AdminHome = () => {
  const [members, setMembers] = useState([]);
  const { isAdmin, isAuth, get, post, del } = useAuth();
  const [settingsObj, setSettingsObj] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});

  const getTransactions = async () => await get(ROUTES.WITHDRAWALS).then(r => { setTransactions(r.data?.transactions); setBalances(r.data?.balances) });
  const handleTransaction = async (wid, approve) => await post(ROUTES.WITHDRAWALS, { wid, approve }).then(r => { setTransactions(r.data?.transactions); setBalances(r.data?.balances) });

  const getMembers = async () => await get(ROUTES.MEMBERS).then(r => setMembers(r.data));
  const updateMember = async (targetRec) => await post(ROUTES.MEMBERS, targetRec).then(r => setMembers(r.data));
  const deleteMember = async (targetRec) => await del(ROUTES.MEMBERS, targetRec).then(r => setMembers(r.data));

  const refreshRevenue = async () => await post(ROUTES.REFRESH_REVENUE).then(r => setMembers(r.data));

  const getSettings = async () => await get(ROUTES.SETTINGS).then(r => setSettingsObj(r?.data));
  const setSettings = async () => await post(ROUTES.SETTINGS, settingsObj).then(r => setSettingsObj(r?.data));

  useEffect(
    () => {
      getMembers(); getSettings(); getTransactions();
    }, []);

  return (
    <>
      <Navbar />
      
             {!isAuth ? (
         // Show colored background when not logged in (login button is shown in navbar)
         <Box sx={{
           background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
           minHeight: '100vh',
           width: '100%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center'
         }}>
           {/* Empty colored screen - no content */}
         </Box>
       ) : !isAdmin ? (
                 // Show NOT ADMIN message when logged in but not admin
         <Box sx={{
           background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
           minHeight: '100vh',
           width: '100%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           flexDirection: 'column'
         }}>
          <Typography variant="h2" fontWeight="700" sx={{ 
            color: '#dc3545',
            mb: 2
          }}>
            NOT ADMIN
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}>
            You don't have permission to access this page.
          </Typography>
        </Box>
      ) : (
                                                                       // Show admin dashboard when user is admin
           <Box sx={{
             ...sharedStyles.pageContainer,
             height:1,
             width: 1,
             overflow: 'auto'
           }}>
             <Box sx={{ mt: 10, mb: 4 }}>
              <Typography variant="h3" fontWeight="700" sx={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #007bff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}>
                Admin Dashboard
              </Typography>
            </Box>
            {/* Settings Section */}
            <Card sx={sharedStyles.formSection}>
              <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: 'white' }}>
                System Settings
              </Typography>
              
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
                <TextField 
                  value={settingsObj.revenueSharePercent ?? ''} 
                  type='number' 
                  variant='outlined' 
                  slotProps={{ htmlInput: { max: 1, min: 0 } }} 
                  onChange={({ target: { value: revenueSharePercent } }) => setSettingsObj((obj) => ({ ...obj, revenueSharePercent }))} 
                  label='Reward Per Revenue Factor 0-1'
                  sx={sharedStyles.input}
                  fullWidth
                />

                <TextField 
                  value={settingsObj.withdrawCronExpression ?? ''} 
                  onChange={({ target: { value: withdrawCronExpression } }) => setSettingsObj((obj) => ({ ...obj, withdrawCronExpression }))} 
                  label='Withdrawal Auto Approve Cron Expression'
                  sx={sharedStyles.input}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Withdrawal Approval Mode</InputLabel>
                  <Select 
                    value={settingsObj.withdrawApprovalMode || 'auto'} 
                    onChange={({ target: { value: withdrawApprovalMode } }) => setSettingsObj(obj => ({ ...obj, withdrawApprovalMode }))}
                    sx={sharedStyles.select}
                  >
                    <MenuItem value='auto'>Auto</MenuItem>
                    <MenuItem value='manual'>Manual</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
                <TextField 
                  value={settingsObj.cronExpression ?? ''} 
                  onChange={({ target: { value: cronExpression } }) => setSettingsObj((obj) => ({ ...obj, cronExpression }))} 
                  label='Revenue Refresh Cron Expression'
                  sx={sharedStyles.input}
                  fullWidth
                />
                
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Revenue Refresh Mode</InputLabel>
                  <Select 
                    value={settingsObj.resetMode || 'auto'} 
                    onChange={({ target: { value: resetMode } }) => setSettingsObj(obj => ({ ...obj, resetMode }))}
                    sx={sharedStyles.select}
                  >
                    <MenuItem value='auto'>Auto</MenuItem>
                    <MenuItem value='manual'>Manual</MenuItem>
                    <MenuItem value='disabled'>Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                <Button 
                  onClick={setSettings} 
                  sx={getButtonStyle('primary')}
                >
                  Save Settings
                </Button>
                <Button 
                  onClick={refreshRevenue} 
                  sx={getButtonStyle('success')}
                >
                  Refresh Revenue
                </Button>
              </Stack>
            </Card>

            {/* Members Section */}
            <Card sx={sharedStyles.formSection}>
              <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: 'white' }}>
                Member Management
              </Typography>
              
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Button 
                  variant='contained' 
                  onClick={() => setMembers(m => [...m, {
                    id: nextNumber(members.map(m => m.user_id)),
                  }])}
                  sx={getButtonStyle('success')}
                >
                  Add New Member
                </Button>
              </Box>
              
                                            <Box sx={{ ...sharedStyles.table, mb: 2, height: 650 }}>
                  <DataGrid 
                    processRowUpdate={updateMember} 
                    editMode='row' 
                    getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id} 
                    columns={[
                      { field: 'user_id', editable: true, headerName: 'User ID', width: 120 },
                      { field: "casino_id", editable: true, headerName: 'Casino ID', width: 120 },
                      { field: "username", headerName: 'Username', width: 150 },
                      { field: "discriminator", headerName: 'Discriminator', width: 120 },
                      { field: "casino_user_id", editable: true, headerName: 'Casino User ID', width: 150 },
                      { field: "prev_revenue_checkpoint", editable: true, headerName: 'Prev Revenue', width: 130 },
                      { field: "curr_revenue_checkpoint", editable: true, headerName: 'Curr Revenue', width: 130 },
                      { field: "prev_wager_checkpoint", editable: true, headerName: 'Prev Wager', width: 130 },
                      { field: "curr_wager_checkpoint", editable: true, headerName: 'Curr Wager', width: 130 },
                      { field: "total_reward", editable: true, headerName: 'Total Reward', width: 130 },
                      {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 100,
                        getActions: (params) => [
                          <GridActionsCellItem 
                            icon={<GridDeleteIcon />} 
                            onClick={() => deleteMember(params.row)} 
                            label="Delete" 
                            sx={{
                              minWidth: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(220, 53, 69, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(220, 53, 69, 0.5)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(220, 53, 69, 0.4)',
                                borderColor: 'rgba(220, 53, 69, 0.7)',
                                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
                                transform: 'scale(1.1)',
                              },
                            }}
                          />
                        ]
                      },
                    ]}
                    rows={members}
                    
                    sx={{ 
                      height: '100%',
                      '& .MuiDataGrid-virtualScroller': {
                        '&::-webkit-scrollbar': { display: 'none' },
                        'scrollbarWidth': 'none',
                        'msOverflowStyle': 'none'
                      },
                    }}
                  />
                </Box>
            </Card>
                         {/* Transactions and Balances Section */}
             <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
               {/* Transactions - 3/4 width */}
               <Box sx={{ flex: '3', minWidth: 0 }}>
                 <Card sx={sharedStyles.formSection}>
                   <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: 'white' }}>
                     Withdrawal Transactions
                   </Typography>
                    
                                       <Box sx={{ ...sharedStyles.table, mb: 2, height: 650 }}>
                      <DataGrid 
                        getRowId={({ wid }) => wid}
                        initialState={{
                          sorting: {
                            sortModel: [{ field: 'wid', sort: 'desc' }],
                          },
                        }}
                        rows={transactions}
                        columns={[
                          { field: 'wid', headerName: 'ID', width: 60, flex: 0.5 },
                          { field: 'amount', headerName: 'Amount', width: 80, flex: 0.8,
                            renderCell: (params) => `$${params.value?.toLocaleString() || '0'}` },
                          { field: 'balance', headerName: 'Balance', width: 80, flex: 0.8,
                            renderCell: (params) => `$${params.value?.toLocaleString() || '0'}` },
                          { 
                            field: 'status', 
                            headerName: 'Status', 
                            width: 90, flex: 0.9,
                            renderCell: (params) => (
                              <Chip 
                                label={params.value} 
                                sx={{
                                  ...sharedStyles.statusChip,
                                  ...getStatusStyle(params.value)
                                }}
                              />
                            )
                          },
                          { field: 'user_id', headerName: 'User ID', width: 80, flex: 0.8 },
                          { field: 'casino_id', headerName: 'Casino ID', width: 90, flex: 0.9 },
                          { field: 'casino_user_id', headerName: 'Casino User ID', width: 120, flex: 1.2 },
                          {
                            field: 'createdAt', 
                            type: 'dateTime',
                            headerName: 'Created',
                            width: 120, flex: 1.2,
                            valueGetter: (value) => value && new Date(value),
                          },
                          {
                            field: 'updatedAt', 
                            type: 'dateTime',
                            headerName: 'Updated',
                            width: 120, flex: 1.2,
                            valueGetter: (value) => value && new Date(value),
                          },
                          {
                            field: 'actions', 
                            type: 'actions',
                            headerName: 'Actions',
                            width: 100, flex: 1,
                            getActions: (params) => params.row.status != 'pending' ? [] : [
                              <GridActionsCellItem 
                                icon={<GridCheckCircleIcon />} 
                                onClick={() => handleTransaction(params.row.wid, true)} 
                                label="Approve" 
                                sx={{
                                  minWidth: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(40, 167, 69, 0.2)',
                                  color: 'white',
                                  border: '1px solid rgba(40, 167, 69, 0.5)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(40, 167, 69, 0.4)',
                                    borderColor: 'rgba(40, 167, 69, 0.7)',
                                    boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              />,
                              <GridActionsCellItem 
                                icon={<GridCloseIcon />} 
                                onClick={() => handleTransaction(params.row.wid, false)} 
                                label="Reject" 
                                sx={{
                                  minWidth: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(220, 53, 69, 0.2)',
                                  color: 'white',
                                  border: '1px solid rgba(220, 53, 69, 0.5)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(220, 53, 69, 0.4)',
                                    borderColor: 'rgba(220, 53, 69, 0.7)',
                                    boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              />
                            ]
                          },
                        ]}
                        sx={{ 
                          height: '100%',
                          '& .MuiDataGrid-virtualScroller': {
                            '&::-webkit-scrollbar': { display: 'none' },
                            'scrollbarWidth': 'none',
                            'msOverflowStyle': 'none'
                          }
                        }}
                      />
                    </Box>
                 </Card>
               </Box>

               {/* Balances - 1/4 width */}
               <Box sx={{ flex: '1', minWidth: 0 }}>
                 <Card sx={sharedStyles.formSection}>
                   <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: 'white' }}>
                     Casino Balances
                   </Typography>
                    
                                       <Box sx={{ ...sharedStyles.table, mb: 2, height: 650 }}>
                      <DataGrid
                        getRowId={({ casino_id, currency_type }) => `${casino_id}-${currency_type}`}
                        columns={[
                          { field: 'casino_id', headerName: 'Casino ID', width: 80, flex: 1 },
                          { field: 'currency_type', headerName: 'Currency', width: 70, flex: 0.8 },
                          { 
                            field: 'value', 
                            headerName: 'Balance', 
                            width: 80, flex: 1,
                            renderCell: (params) => `$${params.value?.toLocaleString() || '0'}`
                          },
                        ]}
                        rows={balances}
                        sx={{ 
                          height: '100%',
                          '& .MuiDataGrid-virtualScroller': {
                            '&::-webkit-scrollbar': { display: 'none' },
                            'scrollbarWidth': 'none',
                            'msOverflowStyle': 'none'
                          }
                        }}
                      />
                    </Box>
                 </Card>
               </Box>
             </Stack>
          </Box>
        )}
    </>
  );
};

export default AdminHome;