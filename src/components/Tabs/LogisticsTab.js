import React, { useEffect, useRef, useState } from "react";

import {Box, Stack, Flex, Tbody, Grid, GridItem, Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, StepSeparator, StepDescription, StepTitle, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverArrow, PopoverCloseButton, PopoverBody, Divider, Text, AbsoluteCenter, InputGroup, InputRightAddon} from '@chakra-ui/react'
import {Input,Button,Select,Link} from '@chakra-ui/react';
import {Modal,ModalOverlay,ModalContent,ModalHeader,ModalFooter,ModalBody,ModalCloseButton,useDisclosure} from "@chakra-ui/react"

import {DataTable, GetTableColors, SQLFilterCondition, SQLOrderCondition, normalizeDate, useModalStyler, useProcessingTypes, useTableOptions, useTableState} from "../DataTable.js";
import {ChangeableText, DetailedDescription, DrawerFullData} from "../DetailedDescription.js";
import TradesTab from "./TradesTab.js";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { DataUpdateCheck } from "../HomePage.js";
import { DetailsPopover } from "../GeneralElements.js";
import { FileAttach } from "../FileAttach.js";
import {SimpleAdderModal,useSimpleAdder} from "../SimpleAdderModal.js";
import { ReactBarcode } from 'react-jsbarcode';

async function attachFiles(files,logistic_id) {
  await window.DB.getGeneralRaw(`
    delete from logistic_files_links 
    where logistic_id=${logistic_id}
  `);
  files.map(async (file)=>{
    file = file.split('\\').join('\\\\');
    let file_id = (await window.DB.getGeneralRaw(`
      replace into files_links (file_path)
      values ('${file}')
    `)).insertId;
    window.DB.getGeneralRaw(`
      insert into logistic_files_links (logistic_id,file_id) values (${logistic_id},${file_id})
    `);
  });
}
function LogisticsAddModal({closure,target_id=-1,inpsInitValues={}}) {
    const [files,setFiles] = useState([]);

    const [logisticComps,setLogisticComps] = useState([]);
    const [tradesComps,setTradesComps] = useState([]);

    const [selectedTransportComp, setSelectedTransportComp] = useState({company:'',address:''});

    const transportCompanyAdder = useSimpleAdder({name:'',address:''});

    const initValues = {transport_company:'', price:-1,shipment_date:'',unloading_date:'',truck_number:'',weight:-1,storage_zone:''};
    const modalStyle = useModalStyler(closure,initValues, (values)=>{
      let correctness = true;
      if (correctness && (target_id != -1)) {
        closure.onClose();
        (async ()=>{
          let logist_id = -1;
          if (target_id != -1) {
            (await window.DB.getGeneralRaw(`
              update logistics
                set price=${values.price},
                shipment_date='${values.shipment_date}',unloading_date='${values.unloading_date}',
                company=(select id from logistic_companies where company='${values.transport_company}' limit 1),
                processing_state=1,
                truck_number=${values.truck_number},
                weight=${values.weight},
                storage_zone=${values.storage_zone}
              where id=${target_id}
            `));
            logist_id = target_id;
          }
          attachFiles(files,logist_id);
        })();
      }
    });

    useEffect(()=>{
      modalStyle.setValues({transport_company:inpsInitValues.transport_company, price:inpsInitValues.price, count:inpsInitValues.count, shipment_date:inpsInitValues.shipment_date});
      window.DB.getGeneralRaw(`select * from logistic_companies`).then((v)=>{
        setLogisticComps(v);
      });
      window.DB.getGeneralRaw(`select * from trades_companies`).then((v)=>{
        setTradesComps(v);
      });
    },[closure.isOpen,transportCompanyAdder.closure.isOpen]);
    
    return (
      <>
      <SimpleAdderModal closure={transportCompanyAdder.closure} onAdd={()=>{
        window.DB.getGeneralRaw(`insert into logistic_companies (company,address) values ('${transportCompanyAdder.name}','${transportCompanyAdder.address}')`);
      }}>
        <Input placeholder="Write transport company name" onInput={(e)=>{transportCompanyAdder.name = e.target.value;}}></Input>
        <Input placeholder="Write company address" onInput={(e)=>{transportCompanyAdder.address = e.target.value;}}></Input>
      </SimpleAdderModal>
      <Modal isOpen={closure.isOpen} onClose={closure.onClose} size={'xl'}>
        <ModalOverlay></ModalOverlay>
        <ModalContent style={modalStyle.shadowStyle}>
          <ModalHeader>
            Logistics
          </ModalHeader>
          <ModalBody>
            <Stack direction={'column'} gap={0}>
              <Flex>
                <InputGroup w={'80%'}>
                  <Input list='logistic_companies' defaultValue={inpsInitValues.transport_company} placeholder="Transport company" onInput={(e)=>{
                    modalStyle.setValues({...modalStyle.values, transport_company:e.target.value}); 
                    let target = logisticComps.find((v)=>{return v.company==e.target.value});
                    if (typeof (target) != 'undefined')
                      setSelectedTransportComp(target)
                    else setSelectedTransportComp({company:'',address:''})}} border={modalStyle.borderStyle('transport_company')}></Input> 
                  <InputRightAddon p={0}>
                    <Button variant={'ghost'} size={'sm'} m={0} onClick={(e)=>{transportCompanyAdder.closure.onOpen()}}><AddIcon color={'GrayText'}/></Button>
                  </InputRightAddon>
                </InputGroup>
                <Flex w={'20%'} justifyContent={'center'}>
                  <Flex direction={'column'} justifyItems={'center'} ml={2} fontSize={13}>
                    <Text textAlign={'center'}>Address</Text>
                    <Text textAlign={'center'} fontStyle={"italic"}>{selectedTransportComp.address}</Text>
                  </Flex>
                </Flex>
              </Flex>
              <Flex>
                <Input defaultValue={inpsInitValues.price} type="number" placeholder="Price" onInput={(e)=>{modalStyle.setValues({...modalStyle.values, price:modalStyle.normNumber(e.target.value)})}} border={modalStyle.borderStyle('price')}></Input>
                <Input defaultValue={inpsInitValues.weight} type="number" placeholder="Weight" onInput={(e)=>{modalStyle.setValues({...modalStyle.values,weight:modalStyle.normNumber(e.target.value)})}} border={modalStyle.borderStyle('weight')}></Input>
                <Input defaultValue={inpsInitValues.truck_number} placeholder="Truck number" onInput={(e)=>{modalStyle.setValues({...modalStyle.values,truck_number:e.target.value})}} border={modalStyle.borderStyle('truck_number')}></Input>
              </Flex>
              <Input defaultValue={inpsInitValues.storage_zone} placeholder="Storage zone" onInput={(e)=>{modalStyle.setValues({...modalStyle.values,storage_zone:e.target.value})}} border={modalStyle.borderStyle('storage_zone')}></Input>
              {/* <Input defaultValue={inpsInitValues.count} type="number" placeholder="Count" width={'20%'} onInput={(e)=>{modalStyle.setValues({...modalStyle.values, count:modalStyle.normNumber(e.target.value)})}} border={modalStyle.borderStyle('count')}></Input> */}
            </Stack>
            <br/>
            
            <Flex direction={'column'}>
              <Flex alignItems={'center'}>
                <Input defaultValue={String(inpsInitValues.shipment_date)} type="datetime-local" onInput={(e)=>{modalStyle.setValues({...modalStyle.values,shipment_date:e.target.value})}} border={modalStyle.borderStyle('shipment_date')}></Input>
                <Text px={2} whiteSpace={'nowrap'}>Loading date</Text>
              </Flex>
              <Flex alignItems={'center'}>
                <Input defaultValue={String(inpsInitValues.shipment_date)} type="datetime-local" onInput={(e)=>{modalStyle.setValues({...modalStyle.values,unloading_date:e.target.value})}} border={modalStyle.borderStyle('shipment_date')}></Input>
                <Text px={2} whiteSpace={'nowrap'}>Unloading date</Text>
              </Flex>
            </Flex>

            <Stack direction={'column'}>
              <Input type="file" multiple border={'none'} padding={0} onChange={(e)=>{
                let files = []; 
                for (let file of e.target.files) {
                  files.push(file.path);
                }
                setFiles(files);
              }}/>
            </Stack>
            <datalist id='logistic_companies'>
              {logisticComps.map((comp,i)=>{
                return <option value={comp.company} key={i}></option>
              })}
            </datalist>
            <datalist id='trades_companies'>
              {tradesComps.map((comp,i)=>{
                return <option value={comp} key={i}></option>
              })}
            </datalist>
          </ModalBody>
          <ModalFooter>
            <Button onClick={()=>{modalStyle.acceptValues();}} marginRight={3}>Add</Button>
            <Button onClick={closure.onClose} variant={'outline'}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </>
    );
}
function LogisticsDetailedDescription({logisticTable,tabTransition,controlable=false}) {
  console.log();
  const barcodeData = useRef('0');
  const barcodeRef = useRef(null);
  useEffect(()=>{
    const target = logisticTable.fullData[logisticTable.detailsTarget];
    (async ()=>{
      let data = (await window.DB.getGeneralRaw(`
        select materials.id,material_count,materials.material from trades
        left join materials on materials.id=trades.material_id
        where trades.id=${target.trade_id}
      `))[0];
      
      const normLength = (num, len) => {if (num === null) return ''.padStart(len,'0'); return num.toString().padStart(len,'0')}
      let dataArr = [normLength(target.id,4), normLength(data.id,3), normLength(data.material_count,4), normLength(target.weight,4), 
                    normLength(target.date.getFullYear(),4),normLength(target.date.getMonth(),2),normLength(target.date.getDate(),2)];
      console.log(data,target);
      console.log(dataArr);
      barcodeData.current = dataArr.join('');
    })();
  },[])
  return (typeof(logisticTable.fullData[logisticTable.detailsTarget]) != 'undefined') ? (
    <Flex direction={'column'}>
      <Flex direction={'row'} justifyContent={'space-between'}>
        <Flex direction={'column'}>
          <Text fontSize={12} marginBottom={2}>
            {String(logisticTable.fullData[logisticTable.detailsTarget].id)} | {normalizeDate(logisticTable.fullData[logisticTable.detailsTarget].date)}
          </Text>
          <Flex direction={'row'}>
            <Flex direction={'column'}>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Company</Text>        <Text><DetailsPopover targetTable={'logistic_companies'}>{logisticTable.fullData[logisticTable.detailsTarget].transport_comp_name}</DetailsPopover></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Price</Text>          <Text><>{logisticTable.fullData[logisticTable.detailsTarget].price}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Count</Text>          <Text><>{logisticTable.fullData[logisticTable.detailsTarget].material_count}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Shipment date</Text>  <Text><>{normalizeDate(logisticTable.fullData[logisticTable.detailsTarget].shipment_date)}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Unloading date</Text> <Text><>{normalizeDate(logisticTable.fullData[logisticTable.detailsTarget].unloading_date)}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Truck number</Text>   <Text><>{logisticTable.fullData[logisticTable.detailsTarget].truck_number}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Weight</Text>         <Text><>{logisticTable.fullData[logisticTable.detailsTarget].weight}</></Text></Flex>
              <Flex direction={'row'} justifyContent={'space-between'} gap={5}><Text>Storage zone</Text>   <Text><>{logisticTable.fullData[logisticTable.detailsTarget].storage_zone}</></Text></Flex>
            </Flex>
            <Flex direction={'column'}>
            </Flex>
          </Flex>
        </Flex>
        <Flex bg={'black'} w={'1px'}></Flex>
        <Flex direction="column" alignItems={'center'} justifyContent={'center'}>
          <FileAttach table={logisticTable} haveControl={controlable}/>
          {controlable ? (
            <Button p={0} w={'fit-content'} h={'fit-content'} variant={'ghost'} onClick={()=>{
              window.Files.saveBarcode(barcodeRef.current.children[0].outerHTML);
            }}><div ref={barcodeRef}><ReactBarcode value={barcodeData.current} options={{width:1,height:40,fontSize:'10px'}} renderer='svg' className='barcode'></ReactBarcode></div></Button>
          ) : ''}
        </Flex>
      </Flex>
    </Flex>
    ) : '';
}
  
function LogisticsTab({tabTransition,outer_onRowClick=()=>{},style={}}) {
    const logisticTable = useTableState({sort:{target:'date',direction:-1},filters:[]},'logistics');
    const processingTypes = useProcessingTypes();

    const editInitValues = useRef({});
    const editTarget = useRef(-1);
    
    const isTabControlable = (window.sessionStorage.getItem('task') == 3);

    function updateTable() {
      let Rows = ['logistics.id','logistics.date','logistic_companies.company','logistics.price','trades.material_count','logistics.shipment_date','logistics.unloading_date'];
      let RowsMasks = ['id','date','transport company', 'price', 'count', 'loading date', 'unloading date'];
      window.DB.getGeneralRaw(`
        select logistics.id,logistics.\`date\`,logistic_companies.company as logistic_company,logistics.price,trades.material_count,logistics.shipment_date,logistics.unloading_date from logistics
        left join logistic_companies on logistics.company=logistic_companies.id
        left join trades on trades.id=logistics.trade_id
        ${SQLFilterCondition(logisticTable.colState.filters)}
        ${SQLOrderCondition(logisticTable.colState.sort)}
      `).then((v)=>{
          logisticTable.setData(v);
          // console.log(``);
      });
      window.DB.getGeneralRaw(`
        select logistics.*,logistic_companies.company as transport_comp_name,trades.material_count from logistics
        left join logistic_companies on logistic_companies.id=logistics.company
        left join trades on trades.id=logistics.trade_id
        ${SQLFilterCondition(logisticTable.colState.filters)}
        ${SQLOrderCondition(logisticTable.colState.sort)}`).then((v)=>{
          // console.log(v);
        logisticTable.setFullData(v);
      });
      
      logisticTable.setRowsMasks(RowsMasks);
      logisticTable.setRows(Rows);
    }
    const lastData = useRef({});
    useEffect(()=>{
      return DataUpdateCheck(updateTable,lastData,'logistics');
    },[]);
    useEffect(()=>{
        updateTable();
        (async ()=>{
          let colors = await GetTableColors('logistics');
          processingTypes.setColors(colors);
        })();
    },[logisticTable.colState, logisticTable.DetailsDisclosure.isOpen,logisticTable.AddDisclosure.isOpen]);
    // console.log(logisticTable.fullData);
    return (
        <>
          <DataTable style={{style}} colors={processingTypes.colors} tableState={logisticTable} caption="logistics table" onRowClick={(data,i)=>{
            outer_onRowClick(data);
            logisticTable.setDetailsTarget(logisticTable.fullData.findIndex((val)=>{return data.id==val.id}));
            window.DB.getGeneralRaw(`
              select logistic_files_links.id,files_links.file_path from logistic_files_links
              join files_links on file_id=files_links.id
              where logistic_id=${data.id}
            `).then((files)=>{
              logisticTable.setFiles(files.map((file)=>{return file.file_path}));
            });
            logisticTable.DetailsDisclosure.onOpen(); 
          }}/>
          <LogisticsAddModal closure={logisticTable.AddDisclosure} target_id={editTarget.current} inpsInitValues={editInitValues.current}></LogisticsAddModal>
          <DetailedDescription disclosure={logisticTable.DetailsDisclosure} onDelete={()=>{
            logisticTable.DetailsDisclosure.onClose();
            window.DB.getGeneralRaw(`delete from logistics where id=${logisticTable.fullData[logisticTable.detailsTarget].id}`);
          }} onEdit={isTabControlable ? (()=>{
            // console.log(logisticTable.fullData[logisticTable.detailsTarget]);
            editTarget.current = logisticTable.fullData[logisticTable.detailsTarget].id;
            editInitValues.current = {transport_company:logisticTable.fullData[logisticTable.detailsTarget].transport_comp_name, price:logisticTable.fullData[logisticTable.detailsTarget].price,count:logisticTable.fullData[logisticTable.detailsTarget].count,shipment_date:logisticTable.fullData[logisticTable.detailsTarget].shipment_date};

            logisticTable.AddDisclosure.onOpen();
          }) : undefined} tableState={logisticTable} isStateSetterVisibile={isTabControlable}>
            <LogisticsDetailedDescription logisticTable={logisticTable} tabTransition={tabTransition} processingTypes={processingTypes} controlable={isTabControlable}/>
          </DetailedDescription>
        </>
    );
}
export default LogisticsTab;

