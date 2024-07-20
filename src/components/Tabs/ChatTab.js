import React, { useEffect, useReducer, useRef, useState } from "react";
import {ChangeableText} from '../DetailedDescription.js'

import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, CloseButton, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Heading, Input, Stack, StackDivider, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { Tabs, TabList, TabPanels, Tab, TabPanel, Link } from '@chakra-ui/react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, SettingsIcon } from "@chakra-ui/icons";
import { DataUpdateCheck } from "../HomePage.js";
import { normalizeDate } from "../DataTable.js";

function Message(message,files=[]) {
    return {
        ...message,
        files: [...files]
    };
}
function FastAlert({children, onConfirm = ()=>{},disclosure}) {
    return (
        <AlertDialog isOpen={disclosure.isOpen} onClose={disclosure.onClose}>
            <AlertDialogOverlay/>
            <AlertDialogContent>
                <AlertDialogHeader>Are you sure?</AlertDialogHeader>
                <AlertDialogBody>{children}</AlertDialogBody>
                <AlertDialogFooter>
                    <Stack direction={'row'}>
                        <Button onClick={()=>{onConfirm(); disclosure.onClose();}}>Yes</Button>
                        <Button onClick={()=>{disclosure.onClose();}} bg={'red'}>No</Button>
                    </Stack>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
function GroupsManipulator({onChange}) {
    const groupsDisclosure = useDisclosure();
    const groupDeleteDisc = useDisclosure();

    const [selectedGroup, setSelectedGroup] = useState(-1);

    const [users,setUsers] = useState([]);
    const [nonGroupusers, setNonGroupUsers] = useState([]);
    const [groups,setGroups] = useState([]);

    const updateUsersView = async (group_id,_searchTerm = "")=>{
        let users = await window.DB.getGeneralRaw(`select users.* from users join users_groups_membership on group_id=${group_id} and user_id=users.id where users.name like "%${_searchTerm}%"`);
        let nonGrUsers = await window.DB.getGeneralRaw(`select * from users where users.id not in (select user_id from users_groups_membership where group_id=${group_id}) and users.name like "%${_searchTerm}%"`);
        setUsers(users);
        setNonGroupUsers(nonGrUsers);
    }
    const [searchTerm, setSearchTerm] = useReducer((state,action)=>{
        if (selectedGroup != -1)
            updateUsersView(selectedGroup,action);
        else
            updateUsersView(0,action);
        state = action;
    },"");

    
    
    useEffect(()=>{
        (async ()=>{
            let users = await window.DB.getGeneralRaw(`select * from users where name like "%${searchTerm}%"`);
            let groups = await window.DB.getGeneralRaw(`select * from users_groups`);

            setUsers(users); setGroups(groups);
        })();
    },[]);
    return (
        <>
            <SettingsIcon onClick={groupsDisclosure.onOpen} cursor={'pointer'}></SettingsIcon>
            <Drawer placement="right" isOpen={groupsDisclosure.isOpen} onClose={groupsDisclosure.onClose} size={'sm'}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    
                    <DrawerHeader>
                        Manipulate groups
                    </DrawerHeader>
                    <DrawerBody>
                        <Flex gap={3} justifyContent={'space-between'}>
                            <Flex direction={'column'}>
                                {groups.map((g,i)=>{return (<Flex key={i} cursor={'pointer'} justifyContent={'space-between'} alignItems={'center'} onClick={async ()=>{
                                    updateUsersView(g.id);
                                    setSelectedGroup(g.id);
                                }} borderBottom={(selectedGroup==g.id)?'1px solid red':''}>
                                    {g.name} <CloseButton size={'sm'} onClick={()=>{groupDeleteDisc.onOpen();}}></CloseButton>
                                    <FastAlert disclosure={groupDeleteDisc} onConfirm={async ()=>{
                                        await window.DB.getGeneralRaw(`delete from users_groups where id=${g.id}`);
                                        setGroups(await window.DB.getGeneralRaw(`select * from users_groups`));
                                        onChange();
                                    }}/>
                                </Flex>)})}
                                <Divider/>
                                <ChangeableText style={{marginTop:'auto',cursor:'default'}} onApply={async (value)=>{
                                    await window.DB.getGeneralRaw(`insert into users_groups (name) values ('${value}')`);
                                    setGroups(await window.DB.getGeneralRaw(`select * from users_groups`));
                                    onChange();
                                }}>Create a new one</ChangeableText>
                            </Flex>
                            <Flex style={{width:'0.8px',backgroundColor:'black'}}></Flex>
                            <Flex direction={'column'}>
                                <Input size={'xs'} onChange={(e)=>{setSearchTerm(e.target.value);}} placeholder="Search"/>
                                {users.map((u,i)=>{return <Flex key={i} justifyContent={'space-between'}>
                                    {u.name}
                                    <Button size={'xs'} variant={'outline'} onClick={async ()=>{
                                        await window.DB.getGeneralRaw(`delete from users_groups_membership where group_id=${selectedGroup} and user_id=${u.id}`);
                                        updateUsersView(selectedGroup,searchTerm);
                                        onChange();
                                    }}><DeleteIcon/></Button>
                                </Flex>})}
                                <Divider borderColor={'red'}/>
                                {nonGroupusers.map((u,i)=>{
                                    return (<Flex key={i} justifyContent={'space-between'}>
                                            {u.name}
                                            <Button size={'xs'} variant={'outline'} onClick={async ()=>{
                                                await window.DB.getGeneralRaw(`insert into users_groups_membership (user_id,group_id) values (${u.id},${selectedGroup})`);
                                                updateUsersView(selectedGroup);
                                                onChange();
                                            }}><AddIcon/></Button>
                                        </Flex>
                                    );
                                })}
                            </Flex>
                        </Flex>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}

export default function ChatTab({messageCountSetter}) {
    const [users,setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    
    const scrollMessagesOffset = useRef(0);
    const messagesCount = useRef(0);
    const messagesCountLimit = 30;

    const [newMessage, setNewMessage] = useState('');
    const [newFiles, setNewFiles] = useState([]);

    const [groups,setGroups] = useState([]);
    
    const [viewTarget, setViewTarget] = useState({target:'users',index:-1});
    let selfId = Number(window.sessionStorage.getItem('id'));

    const [searchTerm, setSearchTerm] = useState('');
    async function getMessagesFromUser(target) {
        let xorClause = `((receiver_id=${selfId} and sender_id=${target}) or (receiver_id=${target} and sender_id=${selfId}))`;
        let _messages = await window.DB.getGeneralRaw(`
            select users_messages.*,users.name from users_messages
            join users on sender_id=users.id
            where ${xorClause}
            order by date DESC
            limit ${messagesCountLimit} offset ${scrollMessagesOffset.current}`);
        window.DB.getGeneralRaw(`
            update users_messages
            set state=1
            where receiver_id=${selfId} and sender_id=${target}
        `);
        updateSendersList();
        let messagesCount = await window.DB.getGeneralRaw(`select count(id) as count from users_messages where state=0 and receiver_id=${Number(window.sessionStorage.getItem('id'))}`)
        messageCountSetter(messagesCount[0].count);
        
        let files = [];
        for (let mess of _messages) {
            let rowfiles = await window.DB.getGeneralRaw(`
                select users_files_links.*,files_links.file_path from users_files_links
                join files_links on file_id=files_links.id
                where message_id=${mess.id}
            `);
            files.push(rowfiles);
        }
        setMessages(_messages.map((mess,ind)=>{return Message(mess,files[ind])}));
    }
    async function getMessagesFromGroup(target) {
        messagesCount.current = (await window.DB.getGeneralRaw(`select count(*) as c from users_groups_messages
                                        join users on sender_id=users.id
                                        where group_id=${target}`))[0].c;
        let _messages = await window.DB.getGeneralRaw(`
            select users_groups_messages.*,users.name from users_groups_messages
            join users on sender_id=users.id
            where group_id=${target}
            order by date DESC
            limit ${messagesCountLimit} offset ${scrollMessagesOffset.current}`);
        
        console.log("messages update");
        
        // await window.DB.getGeneralRaw(`
        //         update users_groups_readed
        //         set date
        //     `);

        let files = [];
        for (let mess of _messages) {
            let rowfiles = await window.DB.getGeneralRaw(`
                select users_files_links.*,files_links.file_path from users_files_links
                join files_links on file_id=files_links.id
                where group_message_id=${mess.id}
            `);
            files.push(rowfiles);
        }
        setMessages(_messages.map((mess,ind)=>{return Message(mess,files[ind])}));
    }
    function updateSendersList() {
        (async ()=>{
            let searchSQL = ``;
            if (searchTerm.length > 0) 
                searchSQL = `where name like '%${searchTerm}%'`;
            // console.log(`select * from users ${searchSQL}`);
            // let _users = await window.DB.getGeneralRaw(`
            //     select * from users ${searchSQL}
            // `);

            // remove substring_index
            let _users = await window.DB.getGeneralRaw(`
                select * from users
                left join (select sender_id as sender_id, count(case when state = 0 then 1 else null end) as mess_count, max(date) as date from users_messages
                            where receiver_id=${selfId}
                            group by sender_id) as mes on mes.sender_id=users.id
                ${searchSQL}
                order by date desc
            `);
            
            setUsers(_users);
        })();
        (async ()=>{
            let searchSQL = ``;
            if (searchTerm.length > 0) 
                searchSQL = `and name like '%${searchTerm}%'`;
            let _groups = await window.DB.getGeneralRaw(`
                SELECT users_groups.* FROM users_groups
                join users_groups_membership on group_id=users_groups.id
                where users_groups_membership.user_id=${selfId} ${searchSQL}`);

            setGroups(_groups);
        })();
    }

    const usersSendersRef = useRef();
    const usersMessagesRef = useRef();
    const usersGroupsRef = useRef();
    useEffect(()=>{
        return DataUpdateCheck(updateSendersList,usersSendersRef,'users_messages',`where receiver_id=${selfId}`);
    },[]);
    useEffect(()=>{
        return DataUpdateCheck(()=>{getMessagesFromUser(viewTarget.index);},usersMessagesRef,'users_messages',`where receiver_id=${selfId} and sender_id=${viewTarget.index}`);
    },[]);
    useEffect(()=>{
        return DataUpdateCheck(()=>{getMessagesFromGroup(viewTarget.index);},usersGroupsRef,'users_groups_messages',`where group_id=${viewTarget.index}`);
    },[]);
    useEffect(()=>{
        scrollMessagesOffset.current = 0;
        updateSendersList();
    },[searchTerm]);
    async function sendMessage() {
        let messageId = -1;
        if (viewTarget.target == 'users') {
            messageId = await window.DB.getGeneralRaw(`insert into users_messages (sender_id,receiver_id,message) values (${selfId},${viewTarget.index},'${newMessage}')`);
            getMessagesFromUser(viewTarget.index);
        }
        else if (viewTarget.target == 'groups') {
            messageId = await window.DB.getGeneralRaw(`insert into users_groups_messages (sender_id,group_id,message) values (${selfId},${viewTarget.index},'${newMessage}')`);
            //await window.DB.getGeneralRaw(`insert into users_groups_readed (user_id,group_message_id,state) values (${selfId},${messageId.insertId},0)`);
            getMessagesFromGroup(viewTarget.index);
        }
        if (newFiles.length > 0) {
            for (let file of newFiles) {
                file = file.split('\\').join('\\\\');
                let fileId = await window.DB.getGeneralRaw(`select * from files_links where file_path='${file}'`);
                if (fileId.length == 0)
                    fileId = await window.DB.getGeneralRaw(`insert into files_links (file_path) values ('${file}')`).insertId;
                else
                    fileId = fileId[0].id;
                
                // let fileId = await window.DB.getGeneralRaw(`
                //     replace into files_links (file_path)
                //     values ('${file}')
                // `).insertId;

                await window.DB.getGeneralRaw(`insert into users_files_links (file_id,${viewTarget.target=='users'?'message_id':'group_message_id'}) values (${fileId},${messageId.insertId})`);
            }
        }
        setNewMessage('');
        setNewFiles([]);
    }
    // console.log(messages.map((m)=>{return m.id}));
    return (
        <Flex direction={'row'} h={'100%'} paddingTop={3}>
            <Tabs w={'20%'}>
                <TabList>
                    <Tab p={0} w={"50%"}>Users</Tab>
                    <Tab p={0} w={'50%'}>Groups</Tab>
                </TabList>
                <Flex><Input size={'xs'} variant={'flushed'} placeholder="Search for user/group" onChange={(e)=>{setSearchTerm(e.target.value); viewTarget.index = -1}}></Input></Flex>
                <TabPanels maxH={'100%'}>
                    <TabPanel p={0}>
                        <Stack divider={<StackDivider/>} cursor={'pointer'} marginTop={'10px'}>
                            {users.map((user,id)=>{ //.filter((user)=>{return user.id!=Number(window.sessionStorage.getItem('id'))})
                                //console.log(user);
                                return (
                                    <Flex key={id} borderLeft={(user.mess_count != null && user.mess_count > 0) ? '2px solid red' : ''} paddingX={1} direction={'column'} onClick={()=>{getMessagesFromUser(user.id); setViewTarget({target:'users',index:user.id});}}>
                                        <Heading color={(viewTarget.index==user.id ? 'rgb(180,40,40,1)' : 'black')} size={'xs'} textTransform={'uppercase'}>
                                            <Flex>
                                                <Flex w={'90%'} direction={'column'}>
                                                    <Flex>{user.name}</Flex>
                                                    <Text fontWeight={500} fontSize={'9px'}>Last message: {(user.date != null) ? normalizeDate(user.date) : ''}</Text>
                                                </Flex>
                                                <Flex alignItems={'center'}>{(user.mess_count != null && user.mess_count > 0) ? <Flex style={{
                                                    backgroundColor: 'red',
                                                    width: '17px', height: '17px',
                                                    justifyContent:'center', alignItems: 'center',
                                                    color:'white',
                                                    borderRadius: '50%',
                                                    fontSize: '10px', fontStyle: 'italic'
                                                }}>{user.mess_count}</Flex> : ''}</Flex>
                                            </Flex>
                                        </Heading>
                                        <Text wordBreak={"break-word"}>{user.last_mess}</Text>
                                    </Flex>
                                );
                            })}
                        </Stack>
                    </TabPanel>
                    <TabPanel p={0}>
                        <Stack divider={<StackDivider/>} cursor={'pointer'} marginTop={'10px'}>
                            {groups.map((group,id)=>{ //.filter((group)=>{return group.id!=Number(window.sessionStorage.getItem('id'))})
                                return (
                                    <Flex key={id} direction={'column'} onClick={()=>{getMessagesFromGroup(group.id); setViewTarget({target:'groups',index:group.id});}}>
                                        <Heading color={(viewTarget.index==group.id ? 'rgb(180,40,40,1)' : 'black')} size={'xs'} textTransform={'uppercase'}>
                                            {group.name}
                                            <Flex alignItems={'center'}>{(group.mess_count != null && group.mess_count > 0) ? <Flex style={{
                                                    backgroundColor: 'red',
                                                    width: '17px', height: '17px',
                                                    justifyContent:'center', alignItems: 'center',
                                                    color:'white',
                                                    borderRadius: '50%',
                                                    fontSize: '10px', fontStyle: 'italic'
                                            }}>{group.mess_count}</Flex> : ''}</Flex>
                                        </Heading>
                                        {/* <Text>Some last message...</Text> */}
                                    </Flex>
                                );
                            })}
                        </Stack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
            <Flex style={{backgroundColor:'black',width:'0.8px'}}></Flex>
            <Stack w={'80%'} gap={0} h={'93vh'}>
                <Flex p={'5px'} alignItems={'center'} justifyContent={'space-between'}>
                    <Flex>
                        {viewTarget.target == 'users' ? (
                            <Heading size={'xs'} textTransform={'uppercase'}>{viewTarget.index == -1 ? '' : users.find(((user)=>{return user.id == viewTarget.index})).name}</Heading>
                        ) : (
                            <Heading size={'xs'} textTransform={'uppercase'}>{viewTarget.index == -1 ? '' : groups.find(((group)=>{return group.id == viewTarget.index})).name}</Heading>
                        )}
                    </Flex>
                    <Flex>
                        <GroupsManipulator onChange={()=>{viewTarget.index=-1; updateSendersList();}}/>
                    </Flex>
                </Flex>
                <Divider />
                <Flex p={'3px'} direction={'column-reverse'} overflowY={'scroll'} scroll={'10%'} onScroll={(e)=>{
                    let h = (e.target.scrollHeight - e.target.offsetHeight);
                    if (h <= 0 || messagesCount.current < messagesCountLimit) return;
                    let scroll = e.target.scrollTop/h;
                    if (scroll < -0.9 && scrollMessagesOffset.current < messagesCount.current-messagesCountLimit) {
                        if (scrollMessagesOffset.current+10 > messagesCount.current-messagesCountLimit) {
                            scrollMessagesOffset.current = (messagesCount.current-messagesCountLimit);
                        } else {
                            scrollMessagesOffset.current = (scrollMessagesOffset.current+10);
                            e.target.scrollTop = -0.9*h;
                        }
                        getMessagesFromGroup(viewTarget.index);
                    }
                    if (scroll > -0.1 && scrollMessagesOffset.current >= 0) {
                        if (scrollMessagesOffset.current-10 > 0) {
                            scrollMessagesOffset.current = (scrollMessagesOffset.current-10);
                            e.target.scrollTop = -0.1*h;
                        } else {
                            
                            scrollMessagesOffset.current = (0);
                        }
                            
                        getMessagesFromGroup(viewTarget.index);
                    }
                }}>
                    {viewTarget.index == -1 ? '' : (messages.map((message,id)=>{return (
                        <Flex key={id} direction={'column'} gap={'5px'}>
                            <Flex direction={'column'} alignItems={message.sender_id == selfId ? 'flex-end' : 'flex-start'}>
                                <Flex alignItems={'center'}>
                                    
                                    <Popover size={'xs'}>
                                        <PopoverTrigger><div style={{width:'8px', height:'8px', backgroundColor:'red', borderRadius:'50%', marginRight:'5px'}}></div></PopoverTrigger>
                                        <PopoverContent>
                                            <PopoverHeader>
                                                Apply command
                                            </PopoverHeader>
                                            <PopoverArrow/>
                                            <PopoverCloseButton />
                                            <PopoverBody>
                                                <Button variant={'outline'} size={'xs'} w={'100%'} onClick={(e)=>{

                                                }}>Delete</Button>
                                            </PopoverBody>
                                        </PopoverContent>
                                    </Popover>
                                    <Text>
                                        {message.name}({message.id}): {message.message}
                                    </Text>
                                </Flex>
                                <Flex direction={'column'}>
                                    {message.files.map((file,id)=>{
                                        return <Text key={id} fontSize={'x-small'}><Link>{file.file_path}</Link></Text> 
                                    })}
                                </Flex>
                            </Flex>
                        </Flex>
                    )}))}
                </Flex>
                <Divider/>
                <Flex direction={'column'}>
                    <Flex alignItems={'center'}>
                        <Textarea placeholder="New message" variant={'flushed'} size={'sm'} value={newMessage} onChange={(e)=>{setNewMessage(e.target.value)}} onKeyDown={(e)=>{if (e.ctrlKey && e.key == 'Enter') sendMessage()}}></Textarea>
                        <Button variant={'outline'} h={'100%'} onClick={sendMessage}>Send</Button>
                    </Flex>
                    <Input type={"file"} multiple border={'none'} p={0} onChange={(e)=>{
                        let files = [];
                        for (let file of e.target.files) {files.push(file.path)};
                        console.log(files);
                        setNewFiles(files);
                    }}></Input>
                </Flex>
            </Stack>
        </Flex>
    );
}
