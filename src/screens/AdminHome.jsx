import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline, Icon, MenuItem, Select, TextField } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';
import { useAuth } from '../utils/auth';
import { Button } from 'react-bootstrap';
import { DataGrid, GridActionsCellItem, GridCheckCircleIcon,  GridCloseIcon,  GridDeleteIcon } from '@mui/x-data-grid';
const nextNumber = numbers => 1 + numbers?.reduce((a, b) => (a > b ? a : b), 0) || 0
const AdminHome = () => {
  // const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const { isAdmin, get, post, del } = useAuth();
  const [settingsObj, setSettingsObj] = useState({});
  const [transactions, setTransactions] = useState([]);
  // const getShopItems = async () => await get(ROUTES.SHOP).then(r => setItems(r.data.items));
  // const setShopItem = async (item) => await post(ROUTES.SHOP, item).then(getShopItems)
  const getTransactions = async () => await get(ROUTES.WITHDRAWALS).then(r => setTransactions(r.data.transactions));
  const handleTransaction = async (wid, approve) => await post(ROUTES.WITHDRAWALS, { wid, approve }).then(getTransactions);
  const updateMember = async (targetRec) => await post(ROUTES.MEMBERS, targetRec).then(getMembers);
  const deleteMember = async (targetRec) => await del(ROUTES.MEMBERS, targetRec).then(getMembers);
  // const resetLeaderboard = async () => await post(ROUTES.RESET_LEADERBOARD).then(getMembers);
  const refreshRevenue = async () => await post(ROUTES.REFRESH_REVENUE).then(getMembers);


  const getMembers = async () => {
    return await get(ROUTES.MEMBERS).then(m => {
      console.log(m);
      ; return setMembers(m.data);
    });
  }

  const getSettings = async () => {
    await get(ROUTES.SETTINGS).then(m => {
      console.log(m);
      ; setSettingsObj(m.data);
    });
  }
  // const deleteItem = async (item_id) => {
  //   console.log('deleting ', item_id);

  //   return await del(ROUTES.SHOP, { item_id });
  // }

  const setSettings = async () => { return await post(ROUTES.SETTINGS, settingsObj); }
  useEffect(
    () => {
      getMembers(); getSettings();
      //  getShopItems(); 
      getTransactions();
    }
    , []);

  return (
    <> <CssBaseline />

      {
        isAdmin == null ? <></> :
          !isAdmin ? <h1>NOT ADMIN</h1> :

            <div style={{ marginTop: 100 }}>
              <>
                {/* <TextField type='number' value={settingsObj.wagerPerPoint ?? ''} onChange={({ target: { value: wagerPerPoint } }) => setSettingsObj((obj) => ({ ...obj, wagerPerPoint }))} label='Wager Per Point' /> */}
                {/* <TextField type='number' value={settingsObj.pointsPerDollar ?? ''} onChange={({ target: { value: pointsPerDollar } }) => setSettingsObj((obj) => ({ ...obj, pointsPerDollar }))} label='Points Per Dollar' /> */}

                <TextField value={settingsObj.revenueSharePercent ?? ''} type='number' variant='outlined' slotProps={{ htmlInput: { max: 1, min: 0 } }} onChange={({ target: { value: revenueSharePercent } }) => setSettingsObj((obj) => ({ ...obj, revenueSharePercent }))} label='Revenue Share Factor 0-1' />
                
                <TextField value={settingsObj.withdrawCronExpression ?? ''} onChange={({ target: { value: withdrawCronExpression } }) => setSettingsObj((obj) => ({ ...obj, withdrawCronExpression }))} label='Withdrawal Cron Expression' />

                <Select value={settingsObj.withdrawApprovalMode || 'auto'} onChange={({ target: { value: withdrawApprovalMode } }) => setSettingsObj(obj => ({ ...obj, withdrawApprovalMode }))}>
                  <MenuItem value='auto'>Auto</MenuItem>
                  <MenuItem value='manual'>Manual</MenuItem>
                </Select>

                <TextField value={settingsObj.cronExpression ?? ''} onChange={({ target: { value: cronExpression } }) => setSettingsObj((obj) => ({ ...obj, cronExpression }))} label='Cron Expression' />
                <Select value={settingsObj.resetMode || 'auto'} onChange={({ target: { value: resetMode } }) => setSettingsObj(obj => ({ ...obj, resetMode }))}>
                  <MenuItem value='auto'>Auto</MenuItem>
                  <MenuItem value='manual'>Manual</MenuItem>
                  <MenuItem value='disabled'>Disabled</MenuItem>
                </Select>

                <Button onClick={setSettings} >Settings</Button>
                {/* <Button onClick={resetLeaderboard} >Reset Leaderboard</Button> */}
                <Button onClick={refreshRevenue} >Refresh Revenue</Button>
              </>

              <>
                <Button variant='contained' onClick={() => setMembers(m => [...m, {
                  id: nextNumber(members.map(m => m.user_id)),
                }]
                )}>ADD member</Button>
                <DataGrid processRowUpdate={updateMember} editMode='row' getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id} columns={[
                  { field: 'user_id', editable: true },
                  { field: "casino_id", editable: true },
                  { field: "username" },
                  { field: "discriminator" },
                  { field: "casino_user_id", editable: true },
                  // { field: "prev_wager_checkpoint", editable: true },
                  // { field: "curr_wager_checkpoint", editable: true },
                  // { field: "total_points", editable: true },
                  { field: "prev_revenue_checkpoint", editable: true },
                  { field: "curr_revenue_checkpoint", editable: true },
                  { field: "total_reward", editable: true },
                  {
                    field: 'actions',
                    type: 'actions',
                    getActions: (params) => [
                      <GridActionsCellItem icon={<GridDeleteIcon />} onClick={() => deleteMember(params.row)} label="Delete" />]
                  },
                ]}
                  rows={members}
                />

              </>
              <DataGrid getRowId={({ id }) => id}
               initialState={{
                sorting: {
                  sortModel: [{ field: 'id', sort: 'desc' }],
                },
              }}
                rows={transactions}
                columns={[
                  { field: 'id' },
                  { field: 'amount' },
                  { field: 'balance' },
                  { field: 'balance_type' },
                  {
                    field: 'status',//   type: "singleSelect", valueOptions:['approved', 'rejected'], editable:({row:{status}})=>['approved', 'rejected'].includes(status)
                  },
                  { field: 'user_id' },
                  { field: 'casino_id' },
                  { field: 'casino_user_id' },
                  { field: 'createdAt',         type: 'dateTime',
                    valueGetter: (value) => value && new Date(value),
                  },
                  { field: 'updatedAt' ,          type: 'dateTime',
                    valueGetter: (value) => value && new Date(value),
                  },

                  {
                    field: 'actions', type: 'actions',
                    getActions: (params) => params.row.status!='pending'?[]:[
                      <GridActionsCellItem icon={<GridCheckCircleIcon />} onClick={() => handleTransaction(params.row.id, true)} label="Approve" />
              ,
                      <GridActionsCellItem icon={<GridCloseIcon />} onClick={() => handleTransaction(params.row.id, false)} label="Reject" />]
                  },
                ]}
              />
              <>

                {
                  /* 
                  <Button variant='contained' onClick={() => setItems(i => [...i, {
                    item_id: nextNumber(items.map(i => i.item_id))
                  }]
                  )}>ADD</Button>
    
                  <DataGrid processRowUpdate={setShopItem} editMode='row' getRowId={({ item_id }) => item_id}
                    rows={items}
                    columns={[
                      { field: 'item_id', editable: true },
                      { field: 'price', editable: true },
                      { field: 'minAmount', editable: true },
                      { field: 'maxAmount', editable: true },
                      { field: 'desc', editable: true },
                      {
                        field: 'actions',
                        type: 'actions',
                        getActions: (params) => [
                          <GridActionsCellItem icon={<GridDeleteIcon />} onClick={() => deleteItem(params.row.item_id)} label="Delete" />]
                      },
                    ]}
                  /> 
                  */
                }
              </>
            </div>
      }</>
  );
};

export default AdminHome;