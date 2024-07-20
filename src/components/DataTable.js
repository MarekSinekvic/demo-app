import React, { Children, useReducer } from "react";
import { useState, useEffect, useCallback, useRef, useContext, createContext } from "react";

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
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Stack,
    Checkbox
  } from '@chakra-ui/react';
import {Button, Flex, Input, Select, Divider} from '@chakra-ui/react';
import {ArrowDownIcon, ArrowUpDownIcon, CloseIcon} from "@chakra-ui/icons"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody
} from '@chakra-ui/react'

import {ChevronUpIcon, ChevronDownIcon, SettingsIcon} from '@chakra-ui/icons';

import "./DataTable.css";
import { DetailedDescription, DrawerFullData } from "./DetailedDescription";
function DataHeader({rows, rowMask, colState, colStateSetter, tableOptions = {}}) {
  const tableData = useContext(DataContext);
  const updateFilters = function (rowName, obj) {
    let newFilters = tableData.filters;
    
    if (typeof (obj.comparison) == 'undefined')
      obj.comparison = '>';
    if (typeof (obj.value) == 'undefined')
      obj.value = '';
    newFilters[rowName] = obj;
    colStateSetter({filters:newFilters, sort:colState.sort});
  }
  const SettingsPopover = (row,i) => {
    return (
      <Popover>
        <PopoverTrigger>
          <SettingsIcon/>
        </PopoverTrigger>
        <PopoverContent animation={"none"}>
          <PopoverHeader>Settings</PopoverHeader>
          <PopoverBody>
            <Select size={'sm'} defaultValue={tableOptions.rowSize} onInput={(e)=>{
              let value = 1.5;
              if (e.target.value == 'small') value = 0.8;
              if (e.target.value == 'large') value = 3;
              tableOptions.setRowSize(value);
            }}>
              <option>small</option>
              <option>medium</option>
              <option>large</option>
            </Select>
            {/* {tableOptions()} */}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
  const ColumnSettingsPopover = (row,i)=>{
    
    // <Checkbox>Hidden</Checkbox>
    return (
      <Popover>
        <PopoverTrigger>
          <ArrowUpDownIcon color={(colState.filters.length > 0 && colState.filters[i].value != '') ? "red" : "none"}/>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>Filter expressions</PopoverHeader>
          <PopoverBody>
            <Flex direction={"column"}>
              <Flex>
                <Select width={20} onInput={(e)=>{updateFilters(row,{...colState.filters[row], comparison:e.target.value})}}>
                  <option>{'>'}</option>
                  <option>{'<'}</option>
                  <option>{'='}</option>
                  <option>{'<>'}</option>
                </Select>
                <Input placeholder="Filter value" onInput={(e)=>{updateFilters(row,{...colState.filters[row], value:e.target.value})}}></Input>
              </Flex>
              <Input placeholder="Search" onInput={(e)=>{
                if (e.target.value == '') updateFilters(row,{...colState.filters[i], value:''});
                else updateFilters(row,{...colState.filters[i], value:`%${e.target.value}%`,comparison:"like"});
              }}></Input>
              <Checkbox>Hidden</Checkbox>
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
  return (
      <Thead>
        <Tr>
          {rows.map((row,i)=>{
            return (
            <Th key={i}>
              <Flex alignItems={'center'} justifyContent={'space-between'}>
                <Flex alignItems={'center'}>
                  {(colState.sort.target == row) ? (colState.sort.direction > 0 ? <ChevronDownIcon/> : <ChevronUpIcon/>) : ""}
                  <span style={{cursor: "pointer"}} onClick={(e)=>{colStateSetter({filters:colState.filters,sort:{target:row,direction:-colState.sort.direction}});}}>
                    {typeof (rowMask[i]) == 'undefined' ? row : rowMask[i]}
                  </span>
                  <ColumnSettingsPopover row={row} i={i}/>
                </Flex>
              
                {i == rows.length-1 ? (SettingsPopover(row,i)) : ''}
              </Flex>
            </Th>)
          })}
          
        </Tr>
      </Thead>
  );
}
function DataBody({children,tableState, onRowAdd = undefined, colors=[],tableOptions={}}) {
  const tableData = useContext(DataContext);
  return (
    <Tbody>
      
      {typeof (onRowAdd) != 'undefined' ? (<tr><td colSpan={tableState.rows.length}><Button width={"100%"} size='sm' variant={"link"} onClick={()=>{onRowAdd(); tableState.AddDisclosure.onOpen();}}>ADD NEW</Button></td></tr>) : ''} 
      
      {children}
       {tableState.data.map((v,ind)=>{
         if (typeof (tableState.fullData[ind]) == 'undefined') return (<>{''}</>);
         let colData = [];
         let index = 0;
         for (let prop in v) {
           if (v[prop] instanceof Date) {
            let hoursStr = `${v[prop].getHours().toString().padStart(2,'0')}:${v[prop].getMinutes().toString().padStart(2,'0')}:${v[prop].getSeconds().toString().padStart(2,'0')}`;
             colData.push(<Td whiteSpace={'collapse'} p={tableOptions.rowSize} key={index}>{v[prop].getFullYear()+"-"+(v[prop].getMonth()+1)+"-"+v[prop].getDate()} | {hoursStr}</Td>);
           } else 
             colData.push(<Td whiteSpace={'collapse'} p={tableOptions.rowSize} key={index}>{v[prop]}</Td>);
           index++;
         }

         let color = colors.find((v)=>{return v.id == tableState.fullData[ind].id});
         return <Tr bg={typeof (color) != 'undefined' ? `${color.color}` : ''} onClick={()=>{tableData.onRowClick(tableState.fullData[ind],ind);}} key={ind} className="dataTableRow">
                  {colData}
                </Tr>;
       })}
    </Tbody>
  );
}
function SQLFilterCondition(filters,additionalConditions = []) {
  let filterCondition = []; 
  for (let filter in filters) {
    const target = filters[filter];
    if (target.value == '') continue;
    if (target.comparison == 'like') target.value = `\'${target.value}\'`;
    filterCondition.push(`${filter} ${target.comparison} ${target.value}`);
  }
  for (let cond of additionalConditions) {
    filterCondition.push(cond);
  }
  if (filterCondition.length > 0)
    filterCondition = 'where ' + `${filterCondition.join('and')}`;
  
  return filterCondition;
}
function SQLOrderCondition(order) {
  let orderCondition = `order by ${order.target} ${order.direction > 0 ? 'ASC' : 'DESC'}`;
  if (order.target == '') orderCondition = '';

  return orderCondition;
}
function useModalStyler(closure, initValues, onCorrect = (values)=>{}) {
  useEffect(()=>{
    setValues(initValues);
    setCorrectState(true);
    setUncorrectTargets({});
  },[closure.isOpen]);
  const [correctState, setCorrectState] = useState(true);
  const [unCorrectTargets, setUncorrectTargets] = useState({});

  const [values,setValues] = useState(initValues);
  let pushValues = (newValues) => {
    setValues({...values,...newValues});
  }
  let acceptValues = () => {
    let correctness = true;
    let newUncorrect = {};
    for (let val in initValues) {
      if (values[val] == initValues[val] || values[val] === null) {
        correctness = false;
        newUncorrect[val] = initValues[val];
      }
    }
    // console.log(values, initValues);
    setCorrectState(correctness);
    setUncorrectTargets(newUncorrect);
    if (correctness) {
      onCorrect(values);
    }
  };
  let borderStyle = (target) => {
    if (target in unCorrectTargets)
      return '1px solid red';
    else 
      return;
  }
  const shadowStyle = {boxShadow:!correctState?'0px 0px 100px red':'',transition:'0.3s ease-out'};
  let normNumber = (val) => {return (val == '') ? -1 : Number(val);}



  return {normNumber, borderStyle,shadowStyle ,acceptValues, correctState,unCorrectTargets, values,setValues,pushValues, _setUncorrectTargets:(value)=>{setUncorrectTargets(value); setCorrectState(false);}};
}
function useProcessingTypes() {
  const [colors,setColors] = useState([]);
  const [processingTypes, setProcessingTypes] = useState([]);
  const [processingTypesTurned, setProcessingTypesTurned] = useState([]);
  
  useEffect(()=>{
    window.DB.getGeneralRaw(`select * from logistic_processing_states`).then((procTypes)=>{
      setProcessingTypes(procTypes);
      setProcessingTypesTurned(procTypes.map((v,i)=>{
        processingTypesTurned[v.id] = 1;
      }));
    });
  },[]);
  return {colors, processingTypes,processingTypesTurned, setProcessingTypesTurned,setProcessingTypes,setColors};
}
function useTableState(colInitState = {},sqlTableName = 'logistics') {
  if (Object.keys(colInitState).length == 0) colInitState = {filters:[],sort:{target:'',direction:-1}};
  const [rows, setRows] = useState([]);
  const [rowsMasks, setRowsMasks] = useState([]);

  const [data, setData] = useState([]);
  const [colState, setColState] = useState(colInitState);
  const [files, setFiles] = useState([]);
  const AddDisclosure = useDisclosure();
  const DetailsDisclosure = useDisclosure();

  const tableNameRef = useRef(sqlTableName);

  const [detailsTarget,setDetailsTarget] = useState(0);
  const [fullData,setFullData] = useState([]);
  function changeFullData(rowId,newObj) {
    let prevData = [...fullData];
    prevData[rowId] = {...fullData[rowId], ...newObj};
    setFullData(prevData);
    let setter = [];
    for (let name in newObj) {
      if (typeof (newObj[name]) == 'string') newObj[name] = `'${newObj[name]}'`;
      setter.push(`${name}=${newObj[name]}`);
    }
    setter = setter.join(',');
    window.DB.getGeneralRaw(
      `update ${sqlTableName}
      set ${setter}
      where id=${fullData[rowId].id}`
    );
  }
  

  return {rows,data,colState, AddDisclosure,DetailsDisclosure, setRows,setData,setColState, detailsTarget,setDetailsTarget, fullData,setFullData,changeFullData, files,setFiles, rowsMasks,setRowsMasks, tableNameRef};
}
function initTableOptions() {return {rowSize:1,tableHeight:'auto'}}
function useTableOptions(tableName = '') {
  let setChkStorage = (name,defValue = 0) => {
    let s = window.localStorage.getItem(`${tableName}-${name}`);
    return (!s ? defValue : s);
  }
  const [rowSize,setRowSize] = useReducer((state,action)=>{
    window.localStorage.setItem(`${tableName}-size`, action); return action;
  },setChkStorage('size',1));
  const tableHeight = useRef('92vh');

  
  return {rowSize,setRowSize, tableHeight}
}
function normalizeDate(date,dateSeparator='-',withTime=true,withDate=true) {
  date = new Date(date);
  if (date.getFullYear() == 1970) return '';
  let dateStr = `${date.getDate()}${dateSeparator}${(date.getMonth()+1)}${dateSeparator}${date.getFullYear()}`;
  let hourStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
  let _date = [];
  if (withDate) _date.push(dateStr);
  if (withTime) _date.push(hourStr);
  return _date.join(' | ');
}
async function GetTableColors(target_table) {//
  // let states = await window.DB.getGeneralRaw(`
  //   select id,processing_state from ${sqlName}
  // `);
  // let colors = [];
  // for (let i = 0; i < states.length; i++) {
  //   if (states[i].processing_state == 0) {
  //     colors.push({id:states[i].id,color:'rgb(250, 250, 172)'});
  //   } else if (states[i].processing_state == 1) {
  //     colors.push({id:states[i].id,color:'rgb(166, 255, 170)'});
  //   }
  // }

  let states = await window.DB.getGeneralRaw(`
    SELECT  trades.id as trade_id, trades.processing_state as trade_state,
            logistics.id as logistics_id, logistics.processing_state as logistics_state,
            production.id as production_id, production.processing_state as production_state,
            technics.id as tehcnics_id, technics.processing_state as technics_state, 
            quality.id as quality_id, quality.processing_state as quality_state 
    FROM trades
    join logistics on logistics.trade_id=trades.id
    join production on production.logistics_id=logistics.id
    join technics on technics.production_id=production.id
    join quality on quality.production_id=production.id
  `);
  
  let confstates = [];
  for (let i = 0; i < states.length; i++) {
    let target_id = states[i].trade_id;
    let target_state = states[i].trade_state;
    if (target_table == 'logistics') {
      target_id = states[i].logistics_id;
      target_state = states[i].logistics_state;
    } else if (target_table == 'production') {
      target_id = states[i].production_id;
      target_state = states[i].production_state;
    } else if (target_table == 'technics') {
      target_id = states[i].tehcnics_id;
      target_state = states[i].technics_state;
    } else if (target_table == 'quality') {
      target_id = states[i].quality_id;
      target_state = states[i].quality_state;
    }
    confstates.push({
      id: target_id,
      state: target_state,
      sumstate: states[i].trade_state + states[i].logistics_state + (states[i].production_state==1) + states[i].technics_state + ((states[i].quality_state == 2) ? 1 : 0)
    });
  }

  let colors = [];
  for (let i = 0; i < confstates.length; i++) {
    if (states[i].trade_state == 0) {
      if (states[i].quality_state == 1) {
        colors.push({id:confstates[i].id,color:'rgb(255, 135, 141)'});
        continue;
      }
      if (target_table == 'trades') {
        if (confstates[i].sumstate == 4) {
          colors.push({id:confstates[i].id,color:'rgb(166, 255, 170)'});
        } else {
          colors.push({id:confstates[i].id,color:'rgb(250, 250, 172)'});
        }
      } else if (target_table == 'quality') {
        if (confstates[i].state == 0) {
          colors.push({id:confstates[i].id,color:'rgb(250, 250, 172)'});
        }
        if (confstates[i].state == 2) {
          colors.push({id:confstates[i].id,color:'rgb(166, 255, 170)'});
        }
      } else {
        if (confstates[i].state == 0) {
          colors.push({id:confstates[i].id,color:'rgb(250, 250, 172)'});
        } else if (confstates[i].state == 1) {
          colors.push({id:confstates[i].id,color:'rgb(166, 255, 170)'});
        } else if (confstates[i].state == 2) {
          colors.push({id:confstates[i].id,color:'rgb(180, 180, 255)'});
        }
      }
    }
  }
  
  return colors;
}
const DataContext = createContext()
function DataTable({tableState,caption="",colors=[],style={},onRowClick=(i)=>{}, onRowAdd=undefined}) { //data,rows=[], colStateBridge=()=>{}
  const [sort,setSort] = useState({target:'',direction:1});
  const [filters,setFilters] = useState({});
  const tableOptions = useTableOptions(tableState.tableNameRef.current);
  // onContextMenu={(e)=>{contextToggle.toggle(e.clientX,e.clientY)}} onClick={()=>{return ((contextToggle.isToggled) ? contextToggle.toggle() : 0);}}
  //if (Object.keys(tableOptions).length == 0) tableOptions = initTableOptions();
  return (
    <>
    <TableContainer maxH={tableOptions.tableHeight.current} overflowY={'auto'} style={style}>
      <Table variant='striped' size="sm" colorScheme="blackAlpha">
        <TableCaption m={0}>{caption}</TableCaption>
        <DataContext.Provider value={{filters:filters,setFilters:setFilters, sort:sort,setSort:setSort, onRowClick:onRowClick}}>
          <DataHeader rows={tableState.rows} rowMask={tableState.rowsMasks} colState={tableState.colState} colStateSetter={tableState.setColState} tableOptions={tableOptions} tableName={tableState.tableNameRef.current}></DataHeader>
          <DataBody tableState={tableState} onRowAdd={onRowAdd} colors={colors} tableOptions={tableOptions}></DataBody>
        </DataContext.Provider>
      </Table>
    </TableContainer>
    </>
  );
}

function DataAdder({closure,tableState, sqlTarget, name = ''}) {
  const initValues = {};
  const inputs = [];
  for (let i = 0; i < tableState.rows.length; i++) {
    let target = tableState.rows[i];
    if (target == 'id' || target == 'date') continue;
    initValues[target] = '';
  }
  const modalStyle = useModalStyler(closure,initValues,(values)=>{
      console.log(values);
      
      window.DB.getGeneralRaw(
        `insert into ${sqlTarget} (${Object.keys(values).join(',')}) values (${Object.values(values).map(v=>{return `'${v}'`}).join(',')})`
      );
      
      closure.onClose();
  });
  let ind = 0;
  for (let val in initValues) {
      inputs.push(<Input key={ind} placeholder={val} onInput={(e)=>{modalStyle.setValues({...modalStyle.values,[val]:e.target.value});}} border={modalStyle.borderStyle(val)}></Input>);
      ind++;
  }
  return (
      <Modal isOpen={closure.isOpen}>
          <ModalOverlay></ModalOverlay>
          <ModalContent style={modalStyle.shadowStyle}>
              <ModalHeader>
                  Add to {name}
              </ModalHeader>
              <ModalBody>
                  {inputs}
              </ModalBody>
              <ModalFooter>
                  <Stack direction={'row'}>
                      <Button onClick={modalStyle.acceptValues}>Add</Button>
                      <Button variant={'outline'} onClick={closure.onClose}>Cancel</Button>
                  </Stack>
              </ModalFooter>
          </ModalContent>
      </Modal>
  );
}
function DefaultTable({sqlTarget = '', style={}}) {
  const tableState = useTableState({},sqlTarget);
  useEffect(()=>{
      let filterCond = SQLFilterCondition(tableState.colState.filters);
      let orderCond = SQLOrderCondition(tableState.colState.sort);
      window.DB.getGeneralRaw(`select * from ${sqlTarget}
                              ${filterCond}
                              ${orderCond} `).then((v)=>{
          tableState.setData(v);
          tableState.setFullData(v);

      });
      window.DB.getGeneralRaw(`describe ${sqlTarget}`).then((v)=>{
          tableState.setRows(v.map((field)=>{
              return field.Field;
          }));
      });
    },[tableState.AddDisclosure.isOpen,tableState.DetailsDisclosure.isOpen,tableState.colState]);
  return (
    <>
      <DataTable style={style} tableState={tableState} caption={sqlTarget} onRowClick={(data,i)=>{
          tableState.setDetailsTarget(tableState.data.findIndex((v)=>{return v.id==data.id}))
          tableState.DetailsDisclosure.onOpen();}} onRowAdd={()=>{}}></DataTable>

      <DataAdder sqlTarget={sqlTarget} tableState={tableState} closure={tableState.AddDisclosure} name={`${sqlTarget}`}></DataAdder>
      <DetailedDescription disclosure={tableState.DetailsDisclosure} onDelete={()=>{window.DB.getGeneralRaw(`delete from ${sqlTarget} where (\`id\`=${tableState.data[tableState.detailsTarget].id})`);}}>
          <DrawerFullData tableState={tableState} targetIndex={tableState.detailsTarget}></DrawerFullData>
      </DetailedDescription>
    </>
  );
}

export {DataTable, SQLFilterCondition,SQLOrderCondition, useModalStyler,useProcessingTypes,useTableState,useTableOptions, normalizeDate, DefaultTable,GetTableColors}; //,DataHeader,DataBody