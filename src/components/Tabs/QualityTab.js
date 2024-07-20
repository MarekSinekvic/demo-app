import React, { useEffect, useRef, useState } from "react";

import {Box, Stack, Flex, Tbody, Grid, GridItem, Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, StepSeparator, StepDescription, StepTitle, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverArrow, PopoverCloseButton, PopoverBody, Divider, Text, AbsoluteCenter, Checkbox, Spacer} from '@chakra-ui/react'
import {Input,Button,Select,Link} from '@chakra-ui/react';
import {Modal,ModalOverlay,ModalContent,ModalHeader,ModalFooter,ModalBody,ModalCloseButton,useDisclosure} from "@chakra-ui/react"

import {DataTable, GetTableColors, SQLFilterCondition, SQLOrderCondition, normalizeDate, useModalStyler, useProcessingTypes, useTableOptions, useTableState} from "../DataTable.js";
import {ChangeableText, DetailedDescription, DrawerFullData} from "../DetailedDescription.js";
import TradesTab from "./TradesTab.js";
import { ArrowRightIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { DataUpdateCheck } from "../HomePage.js";
import { DetailsPopover } from "../GeneralElements.js";
import { attachFiles, FileAttach } from "../FileAttach.js";

function QualityAddModal({closure,tableState,targetId,inpsInitValues}) {
    const [status,setStatus] = useState(0);
    const initValues = {startDate: '',endDate:''};
    const modalState = useModalStyler(closure, initValues, (vals)=>{
      console.log(vals);
      window.DB.getGeneralRaw(`
        update quality
        set check_start_date='${vals.startDate}', check_end_date='${vals.endDate}', processing_state=${status ? 2 : 1}
        where id=${targetId}
      `);
      closure.onClose();
    });
    // console.log(modalState.values);
    return (
      <Modal isOpen={closure.isOpen} onClose={closure.onClose} size={'xl'}>
        <ModalOverlay></ModalOverlay>
        <ModalContent>
          <ModalHeader>
            Quality
          </ModalHeader>
          <ModalBody>
            <Stack>
              <Stack direction={'row'}><Input type="datetime-local" onInput={(e)=>{modalState.setValues({...modalState.values, startDate: e.target.value})}}/><Flex w={'20%'} alignItems={'center'}>Start date</Flex></Stack>
              <Stack direction={'row'}><Input type="datetime-local" onInput={(e)=>{modalState.setValues({...modalState.values, endDate: e.target.value})}}/><Flex w={'20%'} alignItems={'center'}>End date</Flex></Stack>
              <Stack direction={'row'}><Checkbox onInput={(e)=>{setStatus(e.target.checked)}}/> <Text>Quality passed</Text></Stack>
              <FileAttach files={tableState.files} filesSetter={tableState.setFiles} attachFunc={(files)=>{attachFiles(files,tableState.fullData[tableState.detailsTarget].id,"quality_files_links","quality_id")}} clearFiles={()=>{attachFiles([],tableState.fullData[tableState.detailsTarget].id,"quality_files_links","quality_id")}}/>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={()=>{modalState.acceptValues()}} marginRight={3}>Add</Button>
            <Button onClick={closure.onClose} variant={'outline'}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
}
function QualityDetailedDescription({table, processingTypes}) {
    return (
      <Stack>
        <Text fontSize={12} marginBottom={2}>
          {String(table.fullData[table.detailsTarget].id)} | {normalizeDate(table.fullData[table.detailsTarget].date)}
        </Text>
        <Flex alignItems={'center'} gap={3}>
          {normalizeDate(table.fullData[table.detailsTarget].check_start_date)} <ArrowRightIcon/> {normalizeDate(table.fullData[table.detailsTarget].check_end_date)} = {new Date(new Date(table.fullData[table.detailsTarget].check_end_date)-new Date(table.fullData[table.detailsTarget].check_start_date)).toLocaleTimeString()}
        </Flex>
        
      </Stack>
    );
}
  
function QualityTab({tabTransition,outer_onRowClick=()=>{},style={}}) {
    const qualityTable = useTableState({sort:{target:'date',direction:-1},filters:[]},'quality');
    const qualitysOptions = useTableOptions('quality');
    const processingTypes = useProcessingTypes();

    const editInitValues = useRef({});
    const editTarget = useRef(-1);
    
    const isTabControlable = (window.sessionStorage.getItem('task') == 6);
    const isLineFinished = useRef(true);

    function updateTable() {
      let Rows = ['id','date','check_start_date','check_end_date','status'];
      let RowsMasks = ['id','date', 'start date', 'end date', 'status'];
      window.DB.getGeneralRaw(`
        select id,date,check_start_date,check_end_date,processing_state from quality
        ${SQLFilterCondition(qualityTable.colState.filters)}
        ${SQLOrderCondition(qualityTable.colState.sort)}
      `).then((v)=>{
          qualityTable.setData(v);
      });
      window.DB.getGeneralRaw(`
        select * from quality
        ${SQLFilterCondition(qualityTable.colState.filters)}
        ${SQLOrderCondition(qualityTable.colState.sort)}`).then((v)=>{
        qualityTable.setFullData(v);
      });
      
      qualityTable.setRows(Rows);
      qualityTable.setRowsMasks(RowsMasks);
    }
    const lastData = useRef({});
    useEffect(()=>{
      return DataUpdateCheck(updateTable,lastData,'quality');
    },[]);
    useEffect(()=>{
        updateTable();
        (async ()=>{
          let colors = await GetTableColors('quality');
          processingTypes.setColors(colors);
          // console.log(processingTypes.colors);
        })();
    },[qualityTable.colState, qualityTable.DetailsDisclosure.isOpen,qualityTable.AddDisclosure.isOpen]);
    // console.log(qualityTable.fullData);
    return (
        <>
          <DataTable style={{style}} tableState={qualityTable} colors={processingTypes.colors} caption="quality table" onRowClick={(data,i)=>{
            outer_onRowClick(data);
            qualityTable.setDetailsTarget(qualityTable.fullData.findIndex((val)=>{return data.id==val.id}));
            window.DB.getGeneralRaw(`
              select quality_files_links.id,files_links.file_path from quality_files_links
              join files_links on file_id=files_links.id
              where quality_id=${data.id}
            `).then((files)=>{
              qualityTable.setFiles(files.map((file)=>{return file.file_path}));
            });
            qualityTable.DetailsDisclosure.onOpen(); 
          }} tableOptions={qualitysOptions}/>
          <QualityAddModal closure={qualityTable.AddDisclosure} targetId={editTarget.current} inpsInitValues={editInitValues.current} tableState={qualityTable}></QualityAddModal>
          <DetailedDescription disclosure={qualityTable.DetailsDisclosure} onDelete={()=>{
            qualityTable.DetailsDisclosure.onClose();
            window.DB.getGeneralRaw(`delete from quality where id=${qualityTable.fullData[qualityTable.detailsTarget].id}`);
          }} onEdit={isTabControlable ? (()=>{
            // console.log(qualityTable.fullData[qualityTable.detailsTarget]);
            editTarget.current = qualityTable.fullData[qualityTable.detailsTarget].id;
            editInitValues.current = {transport_company:qualityTable.fullData[qualityTable.detailsTarget].transport_comp_name, price:qualityTable.fullData[qualityTable.detailsTarget].price,count:qualityTable.fullData[qualityTable.detailsTarget].count,shipment_date:qualityTable.fullData[qualityTable.detailsTarget].shipment_date};

            qualityTable.AddDisclosure.onOpen();
          }) : undefined} tableState={qualityTable} isStateSetterVisibile={false}>
            <QualityDetailedDescription table={qualityTable} processingTypes={processingTypes}/>
            {/* <DrawerFullData tableState={qualityTable}/> */}
            
          <Divider my={3}/>
            <FileAttach files={qualityTable.files} filesSetter={qualityTable.setFiles} attachFunc={(files)=>{attachFiles(files,qualityTable.fullData[qualityTable.detailsTarget].id,"quality_files_links","quality_id")}} haveControl={isTabControlable} clearFiles={()=>{attachFiles([],qualityTable.fullData[qualityTable.detailsTarget].id,"quality_files_links","quality_id")}}/>
          </DetailedDescription>
        </>
    );
}
export default QualityTab;

