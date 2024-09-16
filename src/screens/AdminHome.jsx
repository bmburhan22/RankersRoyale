import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline, Icon, MenuItem, Select, TextField } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { useAuth } from '../utils/auth';
import { Button } from 'react-bootstrap';
import { DataGrid, GridActionsCellItem, GridColDef, GridDeleteIcon } from '@mui/x-data-grid';
const AdminHome = () => {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const { isAdmin, get, post ,del} = useAuth();
  const [settingsObj, setSettingsObj] = useState({});
  const getShopItems = async () => await get(ROUTES.SHOP).then(r => setItems(r.data.items));
  const setShopItem = async (item) => await post(ROUTES.SHOP, item).then(getShopItems)
  const updateMember = async (targetRec) => await post(ROUTES.MEMBERS, targetRec).then(getMembers);
  const getMembers = async () => {
    await get(ROUTES.MEMBERS).then(m => {
      console.log(m);
      ; setMembers(m.data);
    });
  }

  const getSettings = async () => {
    await get(ROUTES.SETTINGS).then(m => {
      console.log(m);
      ; setSettingsObj(m.data);
    });
  }
  const deleteItem=async(item_id)=>{
    console.log('deleting ' ,item_id);
    
   return await del(ROUTES.SHOP, {item_id});}

  const setSettings = async () => { return await post(ROUTES.SETTINGS, settingsObj); }
  const setCronSettings = async () => { return await post(ROUTES.CRON, settingsObj); }
  useEffect(
    () => { getMembers(); getSettings(); getShopItems(); }
    , []);

  return (
    <> <CssBaseline />
      <div style={{marginTop:100}}>
      <TextField type='number' value={settingsObj.wagerPerPoint ?? ''} onChange={({ target: { value: wagerPerPoint } }) => setSettingsObj((obj) => ({ ...obj, wagerPerPoint }))} label='Wager Per Point' />
      <TextField type='number' value={settingsObj.pointsPerDollar ?? ''} onChange={({ target: { value: pointsPerDollar } }) => setSettingsObj((obj) => ({ ...obj, pointsPerDollar }))} label='Points Per Dollar' />
      <TextField value={settingsObj.cronExpression ?? ''} onChange={({ target: { value: cronExpression } }) => setSettingsObj((obj) => ({ ...obj, cronExpression}))} label='Cron Expression' />
      <Select value={settingsObj.resetMode || 'auto'} onChange={({ target: { value: resetMode } }) => setSettingsObj(obj => ({ ...obj, resetMode }))}>
        <MenuItem value='auto'>Auto</MenuItem>
        <MenuItem value='manual'>Manual</MenuItem>
        <MenuItem value='disabled'>Disabled</MenuItem>
      </Select>

      <Button onClick={setSettings} >Settings</Button>
      <Button onClick={setCronSettings} >Cron Settings</Button>
      <DataGrid processRowUpdate={updateMember} editMode='row' getRowId={({ user_id, casino_id }) => user_id + '-' + casino_id} columns={[
        { field: 'user_id' },
        { field: "casino_id" },
        { field: "prev_wager_checkpoint", editable: true },
        { field: "curr_wager_checkpoint", editable: true },
        { field: "username" },
        { field: "discriminator" },
        { field: "casino_user_id", editable: true },
        { field: "total_points", editable: true }]}
        rows={members}
      />
      <Button variant='contained' onClick={() => setItems(i => [...i, {
        item_id: 1 + items.reduce((a, b) => (a.item_id > b.item_id ? a : b)).item_id ||0
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
              <GridActionsCellItem icon={<GridDeleteIcon/>} onClick={()=>deleteItem( params.row.item_id)} label="Delete" />]
            },
        ]}
      />
      </div>
    </>
  );
};

export default AdminHome;