import { AddIcon, PlusSquareIcon } from "@chakra-ui/icons";
import { Button, ButtonGroup, Divider, Flex, IconButton, Input, Spacer, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { DataTable, SQLFilterCondition, SQLOrderCondition, useTableState } from "./DataTable";

const useLinksSelector = () => {
    const [selectedTargets,setSelectedTargets] = useState([]);

    const [isSelecting,setSelecting] = useState(false);
    const selectedCount = useRef(0);
    return {selectedTargets,setSelectedTargets, isSelecting,setSelecting, selectedCount};
}
function SelectTable({outer_onRowClick=(data,ind)=>{},effectors=[],sqlName='materials',style={}}) {
    const tableState = useTableState({},sqlName);
    
    useEffect(()=>{
        let filterCond = SQLFilterCondition(tableState.colState.filters);
        let orderCond = SQLOrderCondition(tableState.colState.sort);
        (async ()=>{
          let data = (await window.DB.getGeneralRaw(`select * from ${sqlName} 
                                                    ${filterCond} 
                                                    ${orderCond}`));
          tableState.setData(data);
          tableState.setFullData(data);
          let rows = [];
          if (data.length > 0) {
            for (let row in data[0]) {
                rows.push(row);
            }
          }
          tableState.setRows(rows);
        })();
    },[...effectors,tableState.colState]);
    return (
        <DataTable style={style} tableState={tableState} onRowClick={(data,ind)=>{outer_onRowClick(data,ind)}}/>
    );
}
const SelectLinks = ({SelectTab, selector, name = '', haveInput = true, dataToShow = 'date', maxSelectingCount = 1, border = {}, style={}, onSelect = (targets,count)=>{},onExpandData=()=>{}}) => {
    return (
        <Flex direction={'column'} style={style}>
            <Stack w={'100%'} gap={3} alignItems={'center'} direction={(selector.selectedTargets.length == 0 ? 'column' : 'row')}>
                <ButtonGroup isAttached variant={'outline'}>
                    <Button style={border} w={(selector.selectedTargets.length == 0 ? '100%' : 'auto')} onClick={()=>{
                        selector.setSelecting(!selector.isSelecting); 
                        if (!selector.isSelecting && selector.selectedCount.current > 0) {
                            selector.setSelectedTargets([]); 
                            selector.selectedCount.current=0;
                        }    
                    }}>{name}</Button>
                    <IconButton icon={<AddIcon/>} onClick={onExpandData}/>
                </ButtonGroup>
                <Flex direction={'column'}>
                    {(selector.selectedTargets.length == 0) ? '' : (selector.selectedTargets.map((t,id)=>{return (
                        <Flex key={id} direction={'column'}>
                            <Flex gap={2} alignItems={'center'}>
                                <Text w={'70%'}>{String(t.link[dataToShow])}</Text>
                                {(haveInput) ? (<Input w={'30%'} size={'xs'} variant={'flushed'} placeholder="Count" onChange={(e)=>{selector.selectedTargets[id].count = Number(e.target.value)}}/>) : ''}
                                
                            </Flex>
                            {id < selector.selectedTargets.length-1 ? (<Divider my={1}/>) : ''}
                        </Flex>
                        )}))
                    }
                </Flex>
            </Stack>
            <Flex alignItems={'center'} justifyContent={(selector.selectedTargets.length == 0) ? 'justify-content' : 'flex-start'}>
                {selector.isSelecting ? (
                    <SelectTab outer_onRowClick={(data)=>{
                        selector.setSelectedTargets([...selector.selectedTargets,{link:data,count:0}]);
                        selector.selectedCount.current++
                        if (selector.selectedCount.current >= maxSelectingCount) {
                            selector.setSelecting(false);
                        }
                        onSelect(selector.selectedTargets,selector.selectedCount);
                        // console.log(selector.selectedTargets);
                    }}/>
                ) : (<></>)}
            </Flex>
        </Flex>
    );
}

export {SelectLinks,SelectTable, useLinksSelector};