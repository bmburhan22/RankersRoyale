import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline, MenuItem, Select, TextField } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { useAuth } from '../utils/auth';
import { Button } from 'react-bootstrap';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
const AdminHome = () => {
  const [members,setMembers] = useState([]);
  const { isAdmin ,get,post} = useAuth();
  const [editing, setEditing]=useState(false);
  const [settingsObj, setSettingsObj] = useState({});
  // const [targetRec, setTargetRec] = useState({});
  const updateMember=async(targetRec)=>await post(ROUTES.MEMBERS,targetRec ).then(getMembers);
  const getMembers = async ()=>{await get(ROUTES.MEMBERS).then(m=>{console.log(m);
  ;setMembers(m.data);});}
  
  const getSettings = async ()=>{await get(ROUTES.SETTINGS).then(m=>{console.log(m);
    ;setSettingsObj(m.data);});}
    
  const setSettings=async()=>{return await post(ROUTES.SETTINGS, settingsObj); }
useState(
  ()=>{getMembers();getSettings();}
  ,[] );

  return (
    <> <CssBaseline />
      <TextField type='number' value={settingsObj.wagerPerPoint??''} onChange={({ target: { value:wagerPerPoint } }) => setSettingsObj((obj)=>({...obj,wagerPerPoint}))} label='Wager Per Point' />
<Select value={settingsObj.redeem||'auto'} onChange={({target:{value:redeem}})=>setSettingsObj(obj=>({...obj,redeem }))}>
  <MenuItem value='auto'>Auto</MenuItem>
  <MenuItem value='manual'>Manual</MenuItem>
  <MenuItem value='disabled'>Disabled</MenuItem>
</Select>

<Button onClick={setSettings}/>
<DataGrid processRowUpdate={updateMember} editMode='row' getRowId={({user_id,casino_id})=>user_id+'-'+casino_id} columns={[
  {field:'user_id'},
   {field: "casino_id"},
   {field:  "prev_wager_checkpoint", editable:true},
   {field:  "curr_wager_checkpoint", editable:true},
   {field:    "username"},
   {field:  "discriminator"},
   {field:  "casino_user_id", editable:true},
              {field:   "total_points", editable:true}]}
              rows={members}
              />


    </>
  );
};

export default AdminHome;