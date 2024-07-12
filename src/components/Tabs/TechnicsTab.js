import React, { useEffect, useRef, useState } from "react";
import { DataTable, GetTableColors, SQLFilterCondition, SQLOrderCondition, normalizeDate, useModalStyler, useProcessingTypes, useTableOptions, useTableState } from "../DataTable";
import { DetailedDescription, DrawerFullData } from "../DetailedDescription";
import { Button, Checkbox, Divider, Flex, Input, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Stack, Text, Textarea } from "@chakra-ui/react";
import ProductionTab from "./ProductionTab";
import { FileAttach } from "../FileAttach";
import { DataUpdateCheck } from "../HomePage";

function TechnicsAdder({closure,target_id=-1}) {
    const [modalSize,setModalSize] = useState('xl');
    const isStoped = useRef(false);
    const initValues = {date:'',time:'',description:''};
    const technicsModal = useModalStyler(closure,initValues,(vals)=>{
        if (target_id == -1) {
            window.DB.getGeneralRaw(`
                insert into technics (production_id,profilactics_date,profilactics_time,profilactics_description) 
                values (${vals.production_id},'${vals.date}','${vals.time}',"${vals.description}")
            `);
        } else {
            window.DB.getGeneralRaw(`
                update technics
                set profilactics_date='${vals.date}',profilactics_time='${vals.time}',profilactics_description="${vals.description}",
                processing_state=1
                where id=${target_id}
            `);
        }
        closure.onClose();
    });
    
    const useSelector = () => {
        const [selectedTargets,setSelectedTargets] = useState([]);

        const [isSelecting,setSelecting] = useState(false);
        const selectedCount = useRef(0);
        return {selectedTargets,setSelectedTargets, isSelecting,setSelecting, selectedCount};
    }
    const productionSelector = useSelector();
    useEffect(()=>{
        if (productionSelector.isSelecting) {
            setModalSize('full')
        } else {
            setModalSize('xl');
        }
    },[productionSelector.isSelecting]);
    useEffect(()=>{
        productionSelector.setSelectedTargets([]);
        productionSelector.setSelecting(false);
        productionSelector.selectedCount.current=0;
        
    },[]);
    const ProductionTable = ({}) => {
        return (
            <Flex direction={'column'}>
                {target_id == -1 ? (
                    <Flex alignItems={'center'}>
                        <Button variant={'outline'} onClick={()=>{productionSelector.setSelecting(!productionSelector.isSelecting);}} border={technicsModal.borderStyle('logistics_id')}>Select production</Button>
                        <Text>{(productionSelector.selectedCount.current > 0) ? normalizeDate(productionSelector.selectedTargets[0].date) : ""}</Text>
                    </Flex>) : ''}
                {productionSelector.isSelecting ? (
                    <ProductionTab outer_onRowClick={(data)=>{
                        productionSelector.setSelectedTargets([data]);
                        productionSelector.setSelecting(!productionSelector.isSelecting);
                        productionSelector.selectedCount.current++;

                        technicsModal.setValues({...technicsModal.values, production_id:data.id});
                    }}/>
                ):''}
            </Flex>
        );
    }
    return (
        <Modal isOpen={closure.isOpen} onClose={closure.onClose} size={modalSize}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>Add technics record</ModalHeader>
                <ModalBody>
                    <Flex direction={'column'}>
                        <Flex justifyContent={'center'}>
                            <ProductionTable/>
                        </Flex>
                        <Flex direction={'row'} justifyContent={'center'}>
                            <Flex alignItems={'center'} direction={'column'}>
                                <Text fontSize={12}>Prevention date</Text>
                                <Input type="datetime-local" onChange={(e)=>{technicsModal.setValues({...technicsModal.values,date:e.target.value})}} border={technicsModal.borderStyle('date')}/>
                            </Flex>
                            <Flex alignItems={'center'} direction={'column'}>
                                <Text fontSize={12}>Work time</Text>
                                <Input type="time" onChange={(e)=>{technicsModal.setValues({...technicsModal.values,time:e.target.value})}} border={technicsModal.borderStyle('time')}/>
                            </Flex>
                        </Flex>
                        <Flex direction={'column'}>
                            <Textarea placeholder="Write description" onChange={(e)=>{technicsModal.setValues({...technicsModal.values,description:e.target.value})}} border={technicsModal.borderStyle('description')}></Textarea>
                            <Flex>
                                <Checkbox onChange={(e)=>{isStoped.current = e.target.checked}}/><Text>Is stoped</Text>
                                {/* <Select size={'xs'}></Select> */}
                            </Flex>
                        </Flex>
                    </Flex>
                </ModalBody>
                <ModalFooter>
                    <Stack direction={'row'}>
                        <Button onClick={()=>{
                            technicsModal.acceptValues();
                        }} variant={'outline'}>Add</Button>
                        <Button onClick={()=>{
                            closure.onClose();
                        }}>Cancel</Button>
                    </Stack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
function TechnicsDescription({table,controlable}) {
    // console.log(table);
    return (
        <Flex direction={'row'} gap={5}>
            <Flex direction={'column'} w={'25%'}>
                <Flex>{table.fullData[table.detailsTarget].id} | {normalizeDate(table.fullData[table.detailsTarget].date)} | {table.fullData[table.detailsTarget].profilactics_type}</Flex>
                <Divider marginY={2}/>
                <Flex direction={'column'}>
                    <Flex gap={3} justifyContent={'space-evenly'}>
                        <Flex direction={'column'} alignItems={'center'}>
                            <Text textAlign={'center'} lineHeight={'13px'} fontSize={12}>Profilactics date</Text>
                            <Text>{normalizeDate(table.fullData[table.detailsTarget].profilactics_date)}</Text>
                        </Flex>
                        <Flex direction={'column'} alignItems={'center'}>
                            <Text textAlign={'center'} lineHeight={'13px'} fontSize={12}>Profilactics time</Text>
                            {table.fullData[table.detailsTarget].profilactics_time}
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            <Flex style={{width:'0.8px',backgroundColor:'rgb(0,0,0,0.1)'}}></Flex>
            <Flex direction={'column'} w={'85%'}>
                {/* <Link fontSize={14}>Production id: {table.fullData[table.detailsTarget].production_id}</Link> */}
                <Flex p={2} maxW={'100%'}>
                    {table.fullData[table.detailsTarget].profilactics_description}
                </Flex>
                <FileAttach table={table} haveControl={controlable}/>
            </Flex>
        </Flex>
    );
}

function TechnicsTab({outer_onRowClick=()=>{},style={}}) {
    const technicsTable = useTableState({filters:[],sort:{target:'date',direction:-1}},'technics');
    const tableOptions = useTableOptions('technics');
    const tableColors = useProcessingTypes();

    const editTarget = useRef(-1);

    const isTabControlable = (window.sessionStorage.getItem('task') == 3);

    function updateTable() {
        (async ()=>{
            let Rows = ['technics.id','technics.date','technics.profilactics_date','technics.profilactics_time','technics.profilactics_description'];
            let RowsMasks = ['id','date','profilactics date', 'duration', 'description'];
            let data = await window.DB.getGeneralRaw(`
                SELECT ${Rows.join(',')} FROM technics
                #join materials on storage.material_id=materials.id
                ${SQLFilterCondition(technicsTable.colState.filters)}
                ${SQLOrderCondition(technicsTable.colState.sort)}
            `);
            let fullData = await window.DB.getGeneralRaw(`
                select * from technics
                ${SQLFilterCondition(technicsTable.colState.filters)}
                ${SQLOrderCondition(technicsTable.colState.sort)}
            `);
            technicsTable.setData(data);
            technicsTable.setFullData(fullData);

            technicsTable.setRows(Rows);
            technicsTable.setRowsMasks(RowsMasks);

            lastData.current = (await window.DB.getGeneralRaw(`
                select id from technics
                order by id desc
                limit 1
            `))[0];

            let clrs = [];
            for (let d of fullData) {
                if (d.profilactics_type==1)
                    clrs.push({id:d.id,color:'255,170,170'});
            }
            //tableColors.setColors(clrs);
        })()
    }
    const lastData = useRef({});
    useEffect(()=>{
        return DataUpdateCheck(updateTable,lastData,'technics');
    },[]);
    useEffect(()=>{
        updateTable();
        (async ()=>{
          let colors = await GetTableColors('technics');
          tableColors.setColors(colors);
        })();
    },[technicsTable.AddDisclosure.isOpen, technicsTable.DetailsDisclosure.isOpen, technicsTable.colState]);
    return (
    <>
        <DataTable colors={tableColors.colors} tableState={technicsTable} onRowClick={(data,i)=>{
            technicsTable.DetailsDisclosure.onOpen();
            technicsTable.setDetailsTarget(i);
        }}/>
        <DetailedDescription disclosure={technicsTable.DetailsDisclosure} onDelete={()=>{
            window.DB.getGeneralRaw(`
                delete from technics where id=${technicsTable.fullData[technicsTable.detailsTarget].id}
            `);
        }} onEdit={window.sessionStorage.getItem('task') == 5 ? ()=>{editTarget.current = technicsTable.fullData[technicsTable.detailsTarget].id; technicsTable.AddDisclosure.onOpen()} : undefined} 
        tableState={technicsTable} isStateSetterVisibile={!isTabControlable}>
            <TechnicsDescription table={technicsTable} controlable={isTabControlable}/>
        </DetailedDescription>
        <TechnicsAdder closure={technicsTable.AddDisclosure} target_id={editTarget.current}/>
    </>);
}
export default TechnicsTab;