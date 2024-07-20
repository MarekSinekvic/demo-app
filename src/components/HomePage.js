import React, { useRef } from "react";
import { useEffect, useCallback, useState } from 'react';

import TradesTab from "./Tabs/TradesTab.js";
import LogisticsTab from "./Tabs/LogisticsTab.js";
import ProductionTab from "./Tabs/ProductionTab.js";
import ChatTab from "./Tabs/ChatTab.js";
import SettingsTab from "./Tabs/SettingsTab.js";
import StorageTab from "./Tabs/StorageTab.js";
import DatesTab from "./Tabs/DatesTab.js";

import {Box, Stack, Flex, Text} from '@chakra-ui/react'

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import { CloseButton, List, ListItem } from '@chakra-ui/react'

import {SettingsIcon, EmailIcon, CloseIcon, TimeIcon} from '@chakra-ui/icons';
import TechnicsTab from "./Tabs/TechnicsTab.js";
import { useNavigate } from "react-router-dom";
import QualityTab from "./Tabs/QualityTab.js";

async function IsLoggedIn(navigate) {
  let result = await window.DB.getUserByLogin(window.sessionStorage.getItem('name'),window.sessionStorage.getItem('password')); 
  if (result.length == 0) {
      navigate('/');
  }
}
async function Reconnect(intervalRef) {
  let connectionState = await (window.DB.checkError());
  if (connectionState !== null && intervalRef.current == -1) {
      intervalRef.current = setInterval(async ()=>{
          connectionState = (await window.DB.tryReconnect());
          if (connectionState == null) {
              clearInterval(intervalRef.current);
              intervalRef.current = -1;
          }
      },500);
  }
}
function DataUpdateCheck(tableUpdater,lastDataRef,sqlTarget = 'trades', term='') {
  const interval = setInterval(async ()=>{
    let data = (await window.DB.getGeneralRaw(`
        select id from ${sqlTarget}
        ${term}
        order by id desc
        limit 1
    `));
    if (data.length > 0) data = data[0];
    else return;
    if (typeof (lastDataRef.current) == 'undefined') lastDataRef.current = {id:-1};
    if (lastDataRef.current.id != data.id) {
        tableUpdater();
        lastDataRef.current = data;
    }
  },2000);
  
  return ()=>{
    clearInterval(interval);
  };
}
function UpdaterOverlay() {
  return (
    <Flex pos={'fixed'} right={'10%'} bottom={'10%'}>
      new version
    </Flex>
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  
  const [messagesCount, setMessagesCount] = useState(0);

  const [tabsColors,setTabsColors] = useState(new Array(6).fill('transparent'));

  const [newVersion, setNewVersion] = useState('');

  useEffect(()=>{
    return clearInterval(setInterval(()=>{
      window.Update.checkUpdate().then((versions)=>{ // [0]=old, [1]=new
        if (versions[0] != versions[1]) {
          setNewVersion(versions[1]);
        } else {
          setNewVersion('');
        }
      });
    }, 30000));
  }, []);
  useEffect(()=>{
    (async ()=>{
      let _messages = await window.DB.getGeneralRaw(`select count(id) as count from users_messages where state=0 and receiver_id=${Number(window.sessionStorage.getItem('id'))}`)
      setMessagesCount(_messages[0].count);
      // window.DB.getGeneralRaw(`select * from users`);
    })();

    const targetTabColor = 'rgba(0,0,255,0.1)'
    const userTask = Number(window.sessionStorage.getItem('task'));
    const newTabsColors = new Array(6).fill('transparent');
    if (userTask == 4) {newTabsColors[0] = targetTabColor; setTabIndex(0)}
    if (userTask == 3) {newTabsColors[1] = targetTabColor; setTabIndex(1)}
    if (userTask == 2) {newTabsColors[2] = targetTabColor; setTabIndex(2)}
    if (userTask == 5) {newTabsColors[3] = targetTabColor; setTabIndex(3)}
    if (userTask == 6) {newTabsColors[4] = targetTabColor; setTabIndex(4)}
    setTabsColors(newTabsColors);
  },[]);
  const reconnectionRef = useRef(-1);
  useEffect(()=>{
    IsLoggedIn(navigate);
    Reconnect(reconnectionRef);
  });

  return (
    <Box width={"100%"} h={'100%'}>
      <Tabs index={tabIndex} onChange={setTabIndex} h={'100%'} isLazy>
        <TabList>
          <Flex width={"50%"}>
            <Tab bg={tabsColors[0]}>Orders</Tab>
            <Tab bg={tabsColors[1]}>Logistic</Tab>
            <Tab bg={tabsColors[2]}>Production</Tab>
            <Tab bg={tabsColors[3]}>Technics</Tab>
            <Tab bg={tabsColors[4]}>Quality</Tab>
          </Flex>
          <Flex width={"50%"} flexDirection={"row-reverse"}>
          <Tab paddingX={1}><SettingsIcon/></Tab>
            <Tab width={30} style={{position: 'relative', cursor: 'pointer'}} justifyContent={'center'} alignItems={'center'}>
              <EmailIcon color={messagesCount == 0 ? 'green' : 'red'}/>
              <Flex style={{backgroundColor: 'white', borderRadius: '100%', height: "10px", width: '10px', fontSize: '9px', position: 'absolute', left: '60%', top: '50%'}} alignItems={'center'} justifyContent={'center'}>{messagesCount}</Flex>
            </Tab>
            <Tab paddingX={2} style={{borderLeft: "2px solid var(--chakra-colors-chakra-border-color)"}}><TimeIcon/></Tab>
            <Tab paddingX={1}>Storage</Tab>
          </Flex>
        </TabList>
        <TabPanels>
          <TabPanel p={0}><TradesTab tabTransition={(tabIndex)=>{setTabIndex(tabIndex)}}/></TabPanel>
          <TabPanel p={0}><LogisticsTab tabTransition={(tabIndex,tradeId)=>{setTabIndex(tabIndex)}}/></TabPanel>
          <TabPanel p={0}><ProductionTab/></TabPanel>
          <TabPanel p={0}><TechnicsTab/></TabPanel>
          <TabPanel p={0}><QualityTab/></TabPanel>
          
          <TabPanel p={0}> <SettingsTab></SettingsTab> </TabPanel>
          <TabPanel p={0} h={'100%'}><ChatTab messageCountSetter={setMessagesCount}/></TabPanel>
          <TabPanel p={0}><DatesTab/></TabPanel>
          <TabPanel p={0}><StorageTab/></TabPanel>
        </TabPanels>
      </Tabs>
      {newVersion != '' ? <UpdaterOverlay/> : ''}
        
        {/* <DataTable Data={window.DB.getLogistics} updateTable={updateUsersTable} caption="logistics table"/> */}
        {/* <Box position="relative" paddingY="7">
        <Divider/>
        <AbsoluteCenter bg="white" px='2'>
          Add new user
        </AbsoluteCenter>
      </Box> */}
      <Flex style={{position:'fixed',right:'30px',bottom:'30px', color:'white',cursor:'default',opcaity:0.5, backgroundColor: 'red',width:'30px',height:'30px',borderRadius:'50%', justifyContent:'center',alignItems:'center'}} onClick={()=>{window.location.hash = "#"}}>X</Flex>
      {reconnectionRef.current != -1 ? (<Flex style={{
        position:'fixed',right:'0px',bottom:'0px',
        width:'100%',
        background:'linear-gradient(180deg, transparent, red)',color:'white',
        padding:'3px',
        display:'flex', justifyContent:'center'
      }}><Text>Connection problems</Text></Flex>) : ''}
    </Box>
  );
}
export {HomePage,DataUpdateCheck};