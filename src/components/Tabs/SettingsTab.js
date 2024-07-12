import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Divider, Flex, Input, Stack, useDisclosure } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
} from '@chakra-ui/react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
  } from '@chakra-ui/react';
import { DataTable, DefaultTable, SQLFilterCondition,SQLOrderCondition, useModalStyler,useTableState } from "../DataTable";
import {DetailedDescription, DrawerFullData} from "../DetailedDescription";

function SettingsTab() {

    const tradesCompsTable = useTableState({},'trades_companies');
    const logisticCompsTable = useTableState({},'logistic_companies');
    const logisticProcessTable = useTableState({},'logistic_processing_states');
    const usersTable = useTableState({},'users');

    useEffect(()=>{
        let fitlerCond = SQLFilterCondition(tradesCompsTable.colState.filters);
        let orderCond = SQLOrderCondition(tradesCompsTable.colState.sort);
        window.DB.getGeneralRaw(`select * from trades_companies
                                ${fitlerCond}
                                ${orderCond} `).then((v)=>{
            tradesCompsTable.setData(v);
            tradesCompsTable.setFullData(v);

        });
        window.DB.getGeneralRaw(`describe trades_companies`).then((v)=>{
            tradesCompsTable.setRows(v.map((field)=>{
                return field.Field;
            }));
        });

        fitlerCond = SQLFilterCondition(logisticCompsTable.colState.filters);
        orderCond = SQLOrderCondition(logisticCompsTable.colState.sort);
        window.DB.getGeneralRaw(`select * from logistic_companies
                                ${fitlerCond}
                                ${orderCond} `).then((v)=>{

            logisticCompsTable.setData(v);
            logisticCompsTable.setFullData(v);
        });
        window.DB.getGeneralRaw(`describe logistic_companies`).then((v)=>{
            logisticCompsTable.setRows(v.map((field)=>{
                return field.Field;
            }));
        });

        fitlerCond = SQLFilterCondition(logisticProcessTable.colState.filters);
        orderCond = SQLOrderCondition(logisticProcessTable.colState.sort);
        window.DB.getGeneralRaw(`select * from logistic_processing_states
                                ${fitlerCond}
                                ${orderCond} `).then((v)=>{

            logisticProcessTable.setData(v);
            logisticProcessTable.setFullData(v);
        });
        window.DB.getGeneralRaw(`describe logistic_processing_states`).then((v)=>{
            logisticProcessTable.setRows(v.map((field)=>{
                return field.Field;
            }));
        });

        fitlerCond = SQLFilterCondition(usersTable.colState.filters);
        orderCond = SQLOrderCondition(usersTable.colState.sort);
        window.DB.getGeneralRaw(`select * from users
                                ${fitlerCond}
                                ${orderCond} `).then((v)=>{

            usersTable.setData(v);
            usersTable.setFullData(v);
        });
        window.DB.getGeneralRaw(`describe users`).then((v)=>{
            usersTable.setRows(v.map((field)=>{
                return field.Field;
            }));
        });

    },[tradesCompsTable.colState,logisticCompsTable.colState,logisticProcessTable.colState, tradesCompsTable.AddDisclosure.isOpen,logisticCompsTable.AddDisclosure.isOpen,logisticProcessTable.AddDisclosure.isOpen,
    tradesCompsTable.DetailsDisclosure.isOpen,logisticCompsTable.DetailsDisclosure.isOpen,logisticProcessTable.DetailsDisclosure.isOpen,usersTable.DetailsDisclosure.isOpen,usersTable.AddDisclosure.isOpen]);

    return (
        <>
            <Accordion allowToggle>
                <AccordionItem>
                    <AccordionButton>
                        Tables
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <Stack direction={'row'} h={'400px'}>
                            <Box overflowY={'auto'} width={'50%'}>
                                <DefaultTable sqlTarget="trades_companies"/>
                            </Box>
                            <Divider orientation="vertical" height={'100%'}></Divider>
                            <Box overflowY={'auto'} width={'50%'}>
                                <DefaultTable sqlTarget="logistic_companies"/>
                            </Box>
                        </Stack>
                        <Stack direction={'row'} h={'400px'}>
                            <Box w={'50%'}>
                                {/* <DefaultTable sqlTarget="user_tasks"/> */}
                                
                                <DefaultTable sqlTarget="materials"/>
                            </Box>
                            <Divider orientation="vertical" height={'100%'}></Divider>
                            <Box w={'50%'}>
                                <DefaultTable sqlTarget="users"/>
                            </Box>
                        </Stack>
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                    <AccordionButton>
                        
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel></AccordionPanel>
                </AccordionItem>
            </Accordion>
        </>
    );
}
export default SettingsTab;