import React, { useRef } from "react";
import { useEffect, useCallback, useState, useContext } from 'react';
import {useNavigate} from "react-router-dom";

import "./LoginPage.css";

import {Flex, Input, Button, Heading, Text} from "@chakra-ui/react";

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

function LoginPage() {
    const name = useRef('');
    const password = useRef('');
    const [isWrong,setWrong] = useState(false);
    const navigate = useNavigate();
    
    const [dbError, setDbError] = useState(null);
    const reconnectRef = useRef(-1);
    useEffect(()=>{
        (async ()=>{
            let err = await window.DB.checkError();
            setDbError(err);
        })();
        Reconnect(reconnectRef);
    });
    return (
        <Flex justifyContent={"center"} alignItems={"center"} width={"100%"} height={"100vh"} bgColor={"rgb(240,240,240)"}>
            <Flex zIndex={0} id="main-block" direction={"column"} gap={2} bgColor={"white"} padding={"80px 30px"} borderRadius={10} alignItems={'center'}>
                <div className={`overlay n1 ${isWrong ? "wrong" : ""}`}></div>
                <div className={`overlay n2 ${isWrong ? "wrong" : ""}`}></div>
                <div className={`overlay n3 ${isWrong ? "wrong" : ""}`}></div>
                <Heading textAlign={"center"}>Login form</Heading>
                <Input type="text" placeholder="Login" width={300} onInput={(e)=>{name.current = e.target.value}}></Input>
                <Input type="password" placeholder="Password" width={300} onInput={(e)=>{password.current = e.target.value}}></Input>
                <Button type="button" width={300} onClick={async ()=>{
                    let result = await window.DB.getUserByLogin(name.current,password.current); 
                    if (result.length > 0) {
                        window.sessionStorage.setItem("id",result[0].id);
                        window.sessionStorage.setItem("name",result[0].name);
                        window.sessionStorage.setItem("password",(result[0].password));
                        window.sessionStorage.setItem("task",(result[0].task_id));
                        navigate("Home");
                    } else {
                        setWrong(true);
                    }
                    }}>Login</Button>
                {dbError !== null ? <Text width={'200px'} textAlign={'center'} color={'red'}>{String(dbError)}</Text> : ''}
            </Flex>
        </Flex>
    );
}
export default LoginPage;