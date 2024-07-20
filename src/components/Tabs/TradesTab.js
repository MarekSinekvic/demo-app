import React, { useEffect, useRef, useState } from "react";

import {Box, Stack, Flex, Tbody, position, Checkbox, Text, Divider, InputGroup, InputRightAddon, Center, Spacer} from '@chakra-ui/react'
import {Input,Button,Select,Link} from '@chakra-ui/react';
import {Modal,ModalOverlay,ModalContent,ModalHeader,ModalFooter,ModalBody,ModalCloseButton,useDisclosure} from "@chakra-ui/react"

import {DataTable, GetTableColors, SQLFilterCondition,SQLOrderCondition, normalizeDate, useModalStyler,useProcessingTypes, useTableState} from "../DataTable.js";
import {DetailedDescription, DrawerFullData} from "../DetailedDescription.js";
import { AddIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { attachFiles, FileAttach } from "../FileAttach.js";
import { DataUpdateCheck } from "../HomePage.js";
import { SelectLinks, SelectTable, useLinksSelector } from "../DataSelector.js";
import { DetailsPopover } from "../GeneralElements.js";
import {SimpleAdderModal,useSimpleAdder} from "../SimpleAdderModal.js";

function OrdersAddModal({closure}) {
    const initValues = {company:'', price:-1};

    const [address,setAddress] = useState('');
    const [tradeCompanies,setTradeCompanies] = useState([]);
    const [files,setFiles] = useState([]);
    useEffect(()=>{
      window.DB.getGeneral('trades_companies','*').then((v)=>{
        setTradeCompanies(v.map((c)=>{return c.company;}));
      });
    },[closure.isOpen]);
    const modalStyle = useModalStyler(closure,initValues, async (values)=>{
        if (matSelect.selectedTargets.length == 0) {alert('Not selected material'); return;}
        if (matSelect.selectedTargets[0].count == 0) {alert('Not selected materials count'); return;}
        console.log(values);
        let trade_id = (await window.DB.getGeneralRaw(`
          insert into \`trades\` (company_id,price,material_id,material_count, processing_state)
          values ((select id from trades_companies where company='${values.company}'),${values.price},${matSelect.selectedTargets[0].link.id},${matSelect.selectedTargets[0].count},0)
        `)).insertId;
        let logistics_id = (await window.DB.getGeneralRaw(`
          insert into \`logistics\` (trade_id) values (${trade_id})
        `)).insertId;
        let production_id = (await window.DB.getGeneralRaw(`
          insert into \`production\` (logistics_id,trade_id) values (${logistics_id},${trade_id})
        `)).insertId;
        let technics_id = (await window.DB.getGeneralRaw(`
          insert into \`technics\` (production_id,trade_id) values (${production_id},${trade_id})
        `)).insertId;
        let quality_id = (await window.DB.getGeneralRaw(`
          insert into \`quality\` (production_id,trade_id) values (${production_id},${trade_id})
        `)).insertId;
        attachFiles(files,trade_id,"trades_files_links","trade_id");
        closure.onClose();
    });

    
    const tradeCompanyAdder = useSimpleAdder({name:'',address:''});
    const materialAdder = useSimpleAdder({material:'',material_type:0});

    const matSelect = useLinksSelector();
    const matTable = ({outer_onRowClick}) => {return <SelectTable style={{width:'100%'}} effectors={[materialAdder.closure.isOpen]} sqlName="materials" outer_onRowClick={outer_onRowClick}/>};

    return (
      <>
        <SimpleAdderModal closure={materialAdder.closure} onAdd={()=>{window.DB.getGeneralRaw(`insert into materials (material) values ('${materialAdder.material}')`)}}>
          <Input placeholder="Material name" onInput={(e)=>{materialAdder.material = e.target.value}}></Input>
          {/* <Checkbox><Text>Input / Output material</Text></Checkbox>  */}
        </SimpleAdderModal>
        <SimpleAdderModal closure={tradeCompanyAdder.closure} onAdd={()=>{
          window.DB.getGeneralRaw(`insert into trades_companies (company,address) values ('${tradeCompanyAdder.name}','${tradeCompanyAdder.address}')`);
        }}>
          <Input placeholder="Write trade company name" onInput={(e)=>{tradeCompanyAdder.name = e.target.value;}}></Input>
          <Input placeholder="Write company address" onInput={(e)=>{tradeCompanyAdder.address = e.target.value;}}></Input>
        </SimpleAdderModal>
        <Modal size={'xl'} isOpen={closure.isOpen} onClose={closure.onClose}>
          <ModalOverlay></ModalOverlay>
          <ModalContent style={modalStyle.shadowStyle}> {/*border={!correctState?'4px solid rgb(255,205,205)':'none'}*/}
            <ModalHeader>
              Trades
            </ModalHeader>
            <ModalBody>
              <Stack direction={'row'} alignItems={'center'}>
                <InputGroup>
                  <Input placeholder="Company" list="companies" onChange={(e)=>{
                    modalStyle.setValues({...modalStyle.values,company:e.target.value});
                    window.DB.getGeneralRaw(`
                      select address from trades_companies
                      where company="${e.target.value}"
                      limit 1
                    `).then((v)=>{
                      if (v.length == 0) return;
                      setAddress(v[0].address);
                    });
                  }}/>
                  <InputRightAddon p={0}>
                    <Button variant={'ghost'} size={'sm'} m={0} onClick={(e)=>{tradeCompanyAdder.closure.onOpen()}}><AddIcon color={'GrayText'}/></Button>
                  </InputRightAddon>
                </InputGroup>
                <Flex direction={'column'} justifyItems={'center'}>
                  <Text textAlign={'center'}>Address</Text>
                  <Text textAlign={'center'} fontStyle={"italic"}>{address}</Text>
                </Flex>
              </Stack>
              <Stack direction={'row'}>
                <Input placeholder="Price" w={'40%'} onChange={(e)=>{modalStyle.setValues({...modalStyle.values,price:e.target.value})}}/>
              </Stack>
              <Flex w={'100%'}>
                <SelectLinks style={{width:'100%'}} selector={matSelect} SelectTab={matTable} name='materials' dataToShow="material" onExpandData={()=>{materialAdder.closure.onOpen()}}/>
              </Flex>
              <FileAttach files={files} filesSetter={setFiles}/>
              <datalist id='companies'>
                {tradeCompanies.map((v,i)=>{
                  return <option value={v} key={i}></option>
                })}
              </datalist>
            </ModalBody>
            <ModalFooter>
              <Button onClick={()=>{modalStyle.acceptValues()}} marginRight={3}>Add</Button>
              <Button onClick={closure.onClose} variant={'outline'}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
}
function ColoredCircle({clr = 'red'}) {
  return (
    <Flex bg={clr} w={2} h={2} borderRadius={"100%"} pos={'relative'} top={0.5} mx={1}></Flex>
  );
}
function OrdersDescription({table, controlable=false}) {
  const [transportingTarget,setTransportingTarget] = useState(-1);
  const [targetAddress, setTargetAddress] = useState('');

  const [assembledInfo, setAssembledInfo] = useState([]);
  const [productionInnerMats,setProductionInnerMats] = useState([]);

  const [processingStates, setProcessingStates] = useState([]);
  // console.log(assembledInfo,productionInnerMats);
  useEffect(()=>{
    window.DB.getGeneralRaw(`
      select * from logistics where trade_id=${table.detailsTarget}
    `).then((data)=>{
      if (data.length == 0) return;
      setTransportingTarget(data[0].id);
    });

    (async ()=>{
      let address = (await window.DB.getGeneralRaw(`
        select address from trades_companies
        where id=${table.fullData[table.detailsTarget].company_id}
      `))[0].address;
      setTargetAddress(address);
    })();

    (async ()=>{
      let tradeId = table.fullData[table.detailsTarget].id;

      let tradesRows = ['trades.id','trades.date',
                        'trades.price','materials.material','trades.material_count',
                        'trades_companies.company as trade_company','trades_companies.address as trade_address'];
      let logisticsRows = ['logistics.id','logistics.date', 'logistic_companies.company as transport_company', 'logistic_companies.address as transport_comp_address',
                          'logistics.price','logistics.shipment_date','logistics.unloading_date', 'logistics.truck_number','logistics.weight as logist_weight', 'logistics.storage_zone'];
      let productionRows = ['production.id as prod_id', 'production.date', 'production.deadline_date', 'production.weight','production.waste'];
      let technicsRows = ['technics.id','technics.date', 'technics.profilactics_date','technics.profilactics_time','technics.profilactics_description','technics.profilactics_time'];
      let qualityRows = ['quality.id','quality.date', 'quality.check_start_date','quality.check_end_date','quality.processing_state'];
      
      let joinedRows = [...tradesRows, ...logisticsRows,...productionRows,...technicsRows,...qualityRows];
      let data = await window.DB.getGeneralRaw(`
        select ${joinedRows.join(',')} from trades
        left join trades_companies on trades.company_id=trades_companies.id
        left join materials on materials.id=trades.material_id
        
        left join logistics on logistics.trade_id=trades.id
        left join logistic_companies on logistics.company=logistic_companies.id

        left join production on production.logistics_id=logistics.id

        left join technics on technics.production_id=production.id
        left join quality on quality.production_id=production.id
        where trades.id=${tradeId}
      `);
      if (data.length > 0) {
        setAssembledInfo(data[0]);

        data = await window.DB.getGeneralRaw(`
            select * from production_inner_materials
            left join materials on production_inner_materials.inner_material_id=materials.id
            where production_id=${data[0].prod_id}
        `);
        setProductionInnerMats(data);
      }
    })();
    (async ()=>{
      let proc_states = await window.DB.getGeneralRaw(`
        select trades.processing_state as trade_state, logistics.processing_state as logistic_state, production.processing_state as production_state, technics.processing_state as technics_state, quality.processing_state as quality_state from trades
        join logistics on logistics.trade_id=trades.id
        join production on production.trade_id=trades.id
        join technics on technics.trade_id=trades.id
        join quality on logistics.trade_id=trades.id`);
        setProcessingStates(proc_states[table.detailsTarget]);
        // console.log(proc_states);
    })();
  },[table.detailsTarget]);
  
  return (
    <>
      <Flex>
        <Text fontSize={12}>{table.fullData[table.detailsTarget].id} : {normalizeDate(table.fullData[table.detailsTarget].date)}</Text>
      </Flex>
      <Flex direction={'row'} gap={5} w={'100%'} justifyContent={'space-evenly'}>
        <Flex direction={'column'} gap={0.2}>
          <Center alignContent={'center'}>Trades <ColoredCircle clr={processingStates.trade_state == 0 ? 'red' : 'green'}/></Center>
          <DetailsPopover targetTable={'trades_companies'}>
            <Flex justifyContent={'space-between'} gap={6}><Text>Company:</Text><Text>{table.fullData[table.detailsTarget].company}</Text></Flex>
          </DetailsPopover>
          <Flex justifyContent={'space-between'} gap={6}><Text>Address:</Text><Text>{targetAddress}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Material </Text> <Text>{table.fullData[table.detailsTarget].material} : {table.fullData[table.detailsTarget].material_count}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Price:</Text><Text>{table.fullData[table.detailsTarget].price}</Text></Flex>
        </Flex>
        <Flex style={{width:'0.8px', backgroundColor:'rgba(0,0,0,0.1)'}}></Flex>
        <Flex direction={'column'}>
          <Center>Logistics <ColoredCircle clr={processingStates.logistic_state == 0 ? 'red' : 'green'}/></Center>
          <Flex justifyContent={'space-between'} gap={6}><Text>Company</Text><Text>{assembledInfo.transport_company}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Price</Text><Text>{assembledInfo.price}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Weight</Text><Text>{assembledInfo.logist_weight}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Truck number</Text><Text>{assembledInfo.truck_number}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Storage zone</Text><Text>{assembledInfo.storage_zone}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Ship date</Text><Text>{normalizeDate(assembledInfo.shipment_date)}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Unload date</Text><Text>{normalizeDate(assembledInfo.unloading_date)}</Text></Flex>
        </Flex>
        <Flex style={{width:'0.8px', backgroundColor:'rgba(0,0,0,0.1)'}}></Flex>
        <Flex direction={'column'}>
          <Center>Production <ColoredCircle clr={processingStates.production_state == 0 ? 'red' : (processingStates.production_state == 2 ? 'blue' : 'green')}/></Center>
          <Flex justifyContent={'space-between'} gap={6}><Text>Finish</Text><Text>{normalizeDate(assembledInfo.deadline_date)}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Weight</Text><Text>{assembledInfo.weight}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Waste</Text><Text>{assembledInfo.waste}</Text></Flex>
          <Text>Inner materials:</Text>
          <Flex direction={'column'} fontSize={12} ml={2}>
            {productionInnerMats.map((v,i)=>{
              return (<Text key={i}>{v.material} : {v.count}</Text>);
            })}
          </Flex>
        </Flex>
        <Flex style={{width:'0.8px', backgroundColor:'rgba(0,0,0,0.1)'}}></Flex>
        <Flex direction={'column'}>
          <Center>Technics <ColoredCircle clr={processingStates.technics_state == 0 ? 'red' : 'green'}/></Center>
          <Flex justifyContent={'space-between'} gap={6}><Text>Profilactics</Text><Text>{normalizeDate(assembledInfo.profilactics_date)}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Time</Text><Text>{assembledInfo.profilactics_time}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>Description</Text><Text>{assembledInfo.profilactics_description}</Text></Flex>
        </Flex>
        <Flex style={{width:'0.8px', backgroundColor:'rgba(0,0,0,0.1)'}}></Flex>
        <Flex direction={'column'}>
          <Center>Quality <ColoredCircle clr={processingStates.quality_state == 0 ? 'red' : 'green'}/></Center>
          <Flex justifyContent={'space-between'} gap={6}><Text>Start</Text><Text>{normalizeDate(assembledInfo.check_start_date)}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>End</Text><Text>{normalizeDate(assembledInfo.check_end_date)}</Text></Flex>
          <Flex justifyContent={'space-between'} gap={6}><Text>State</Text><Text>{assembledInfo.processing_state}</Text></Flex>
        </Flex>
      </Flex>
      <br/>
      <FileAttach files={table.files} filesSetter={table.setFiles} haveControl={(controlable && table.fullData[table.detailsTarget].processing_state == 0)} attachFunc={(files)=>{attachFiles(files,table.fullData[table.detailsTarget].id,"trades_files_links","trade_id");}} clearFiles={()=>{attachFiles([],table.fullData[table.detailsTarget].id,'trades_files_links','trade_id')}}/>
    </>
  );
}
  
function TradesTab({outer_onRowClick=()=>{},tabTransition=()=>{}}) {
    const processingTypes = useProcessingTypes();
    const tradesTable = useTableState({sort:{target:'date',direction:-1},filters:[]},'trades');

    const isTabControlable = (window.sessionStorage.getItem('task') == 4);

    function updateTable() {
      let Rows = ['trades.id','trades.date','comps.company','trades.price','mats.material', 'trades.material_count']; //trades.id,purchased_count,purchased_price, sold_count,sold_price,trades_companies.company
      let RowsMasks = ['id','date','company','price','material','count'];
      
      window.DB.getGeneralRaw(`
        select trades.id,trades.date,comps.company,trades.price,mats.material,trades.material_count from trades
        left join trades_companies as comps on trades.company_id=comps.id
        left join materials as mats on mats.id=trades.material_id
        ${SQLFilterCondition(tradesTable.colState.filters)}
        ${SQLOrderCondition(tradesTable.colState.sort)}
      `).then((v)=>{
        tradesTable.setData(v);
      });
      window.DB.getGeneralRaw(`
        select trades.*, mats.material,comps.company from trades
        left join materials as mats on mats.id=trades.material_id
        left join trades_companies as comps on comps.id=trades.company_id
        ${SQLFilterCondition(tradesTable.colState.filters)}
        ${SQLOrderCondition(tradesTable.colState.sort)}`).then(async (fData)=>{

          tradesTable.setFullData(fData);
      });

      tradesTable.setRows(Rows);
      tradesTable.setRowsMasks(RowsMasks);
    }
    const lastData = useRef({});
    useEffect(()=>{
      return DataUpdateCheck(updateTable,lastData,'trades');
    },[]);
    useEffect(()=>{
      updateTable();
      (async ()=>{
        let colors = await GetTableColors('trades');
        processingTypes.setColors(colors);
      })();
      
    },[tradesTable.colState,tradesTable.DetailsDisclosure.isOpen,tradesTable.AddDisclosure.isOpen]);
    
    const [transportingTarget,setTransportTarget] = useState({});
    return (
      <>
        <DataTable tableState={tradesTable} caption="trades table" colors={processingTypes.colors} onRowClick={(data)=>{
          let targetIndex = tradesTable.fullData.findIndex((fData)=>{return fData.id==data.id}); 
          tradesTable.DetailsDisclosure.onOpen();
          tradesTable.setDetailsTarget(targetIndex);
          window.DB.getGeneralRaw(`select * from logistics where trade_id=${data.id}`).then((row)=>{if (row.length > 0) setTransportTarget(row[0])});
          outer_onRowClick(data,targetIndex);}}
          onRowAdd={isTabControlable ? ()=>{} : undefined}
        />
        
        <OrdersAddModal closure={tradesTable.AddDisclosure} table={tradesTable}></OrdersAddModal>
        <DetailedDescription disclosure={tradesTable.DetailsDisclosure} onDelete={()=>{
          tradesTable.DetailsDisclosure.onClose();
          window.DB.getGeneralRaw(`delete from trades where id=${tradesTable.fullData[tradesTable.detailsTarget].id}`);
        }} tableState={tradesTable} isStateSetterVisibile={isTabControlable}>
          {/* <DrawerFullData tableState={tradesTable} targetIndex={tradesTable.detailsTarget}></DrawerFullData> */}
          <OrdersDescription table={tradesTable} controlable={isTabControlable}/>
        </DetailedDescription>
      </>
    );
}
export default TradesTab;

