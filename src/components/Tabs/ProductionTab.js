import React, { useEffect, useRef, useState } from "react";
import { DataTable, GetTableColors, SQLFilterCondition, SQLOrderCondition, normalizeDate, useModalStyler, useProcessingTypes, useTableOptions, useTableState } from "../DataTable";
import { Button, Checkbox, Divider, Flex, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { CompletedCheckbox, DetailedDescription, DrawerFullData } from "../DetailedDescription";
import LogisticsTab from "./LogisticsTab";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { attachFiles, FileAttach } from "../FileAttach";
import { SelectLinks, SelectTable, useLinksSelector } from "../DataSelector";
import { DataUpdateCheck } from "../HomePage";
import { SimpleAdderModal, useSimpleAdder } from "../SimpleAdderModal";


function ProductionAdder({disclosure,target_id=-1,inpsInitValues={}}) {
    const [modalSize,setModalSize] = useState('xl');
    const initValues = {inMatCount:0,deadLineDate:'', weight:null,waste:null};
    const prodModal = useModalStyler(disclosure,initValues,(values)=>{
        (async ()=>{
            (await window.DB.getGeneralRaw(`
                update production
                set deadline_date='${values.deadLineDate}',weight=${values.weight},waste=${values.waste}
                where id=${target_id}
            `));

            (await window.DB.getGeneralRaw(`delete from production_inner_materials where production_id=${target_id}`));
            let rows = [];
            for (let i = 0; i < InnerMaterialSelector.selectedTargets.length; i++) {
                let target = InnerMaterialSelector.selectedTargets[i];
                rows.push(`${target.link.id},${target_id},${target.count}`);
            }
            rows = rows.map((r)=>{return `(${r})`});
            window.DB.getGeneralRaw(`
                insert into production_inner_materials (inner_material_id,production_id,count) values ${rows.join(',')}
            `);
        })();
        
        InnerMaterialSelector.setSelectedTargets([]);
        InnerMaterialSelector.selectedCount.current = 0;

        disclosure.onClose();
    });
    const innerMaterialAdder = useSimpleAdder({material:''});

    const InnerMaterialSelector = useLinksSelector();
    let MaterialsTable = ({outer_onRowClick})=>{return <SelectTable style={{width:'100%'}} effectors={[innerMaterialAdder.closure.isOpen]} outer_onRowClick={outer_onRowClick} sqlName="materials"/>};
    useEffect(()=>{
        //prodModal.setValues(inpsInitValues);
        if (InnerMaterialSelector.isSelecting) setModalSize('full');
        else setModalSize('xl');
    },[InnerMaterialSelector.isSelecting]);

    return (
        <>
            <SimpleAdderModal closure={innerMaterialAdder.closure} onAdd={()=>{window.DB.getGeneralRaw(`insert into materials (material) values ('${innerMaterialAdder.material}')`)}}>
                <Input placeholder="Material" onInput={(e)=>{innerMaterialAdder.material = e.target.value}}></Input>
            </SimpleAdderModal>
            <Modal isOpen={disclosure.isOpen} onClose={disclosure.onClose} size={modalSize}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>
                        Add to Production table
                    </ModalHeader>
                    <ModalBody>
                        <SelectLinks name="Inner materials" selector={InnerMaterialSelector} SelectTab={MaterialsTable} dataToShow='material' maxSelectingCount={128} border={{border:prodModal.borderStyle('inMatCount')}} onSelect={()=>{prodModal.pushValues({inMatCount:InnerMaterialSelector.selectedCount.current})}} onExpandData={()=>{innerMaterialAdder.closure.onOpen()}}></SelectLinks>
                        <Divider my={3}/>
                        <Stack direction={'row'} justifyContent={'center'}>
                            <Flex direction={'column'} alignItems={'center'}>
                                <Input type="datetime-local" onChange={(e)=>{prodModal.pushValues({deadLineDate:e.target.value})}} border={prodModal.borderStyle('deadLineDate')}/> 
                                <Text fontSize={12}>Loading date</Text>
                            </Flex>
                        </Stack>
                        <Stack direction={'row'}>
                            <Input type="number" defaultValue={inpsInitValues.weight} placeholder="Weights (kg)" onChange={(e)=>{prodModal.pushValues({weight:e.target.value})}} border={prodModal.borderStyle('weight')}/>
                            <Input type="number" defaultValue={inpsInitValues.waste} placeholder="Waste" onChange={(e)=>{prodModal.pushValues({waste:e.target.value})}} border={prodModal.borderStyle('waste')}/>
                        </Stack>
                    </ModalBody>
                    <ModalFooter>
                        <Stack direction={'row'}>
                            <Button onClick={()=>{
                                prodModal.acceptValues();
                            }} variant={'outline'}>Add</Button>
                            <Button onClick={()=>{
                                disclosure.onClose();

                                InnerMaterialSelector.setSelectedTargets([]);
                                InnerMaterialSelector.selectedCount.current = 0;
                            }}>Cancel</Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
function ProductionDescription({productionTable,innerMaterials, controlable=false}) {
    return (
        <>
            <Flex gap={5} justifyContent={'space-between'}>
                {/* <DrawerFullData tableState={productionTable} targetIndex={productionTable.detailsTarget}></DrawerFullData> */}
                <Flex>
                    <Flex direction={'column'}>
                        <Text fontSize={12}>{productionTable.fullData[productionTable.detailsTarget].id} : {normalizeDate(productionTable.fullData[productionTable.detailsTarget].date)}</Text>
                        <Divider marginY={2}/>
                        <Flex alignItems={'center'} gap={3}>
                            <Stack direction={'column'} gap={0}>
                                {innerMaterials.current.map((mat,i)=>{
                                    return (
                                        <Flex key={i}> {mat.material}: {mat.count}</Flex>
                                    );
                                })}
                            </Stack>
                            <ArrowRightIcon/>
                            <Stack>
                                <>{productionTable.fullData[productionTable.detailsTarget].material}: {productionTable.fullData[productionTable.detailsTarget].material_count}</>
                            </Stack>
                            <Divider orientation="vertical"/>
                            <Flex gap={8}>
                                <Flex alignItems={'center'} direction={'column'}>
                                    Loading date
                                    <Flex>{normalizeDate(productionTable.fullData[productionTable.detailsTarget].deadline_date)}</Flex>
                                </Flex>
                                <Flex alignItems={'center'} direction={'column'}>
                                    Weight
                                    <Flex>{productionTable.fullData[productionTable.detailsTarget].weight}</Flex>
                                </Flex>
                                <Flex alignItems={'center'} direction={'column'}>
                                    Waste
                                    <Flex>{productionTable.fullData[productionTable.detailsTarget].waste}</Flex>
                                </Flex>
                            </Flex>
                        </Flex>
                        <Flex marginY={2}></Flex>
                        {/* <Flex>
                            <Text>Logistics id: {(productionTable.fullData[productionTable.detailsTarget].logistics_id)}</Text>
                        </Flex> */}
                    </Flex>
                </Flex>
                <Flex>
                    <FileAttach files={productionTable.files} filesSetter={productionTable.setFiles} haveControl={controlable && productionTable.fullData[productionTable.detailsTarget].processing_state == 0} attachFunc={(files)=>{attachFiles(files,productionTable.fullData[productionTable.detailsTarget].id,'production_files_links','production_id')}} clearFiles={()=>{attachFiles([],productionTable.fullData[productionTable.detailsTarget].id,'production_files_links','production_id')}}/>
                </Flex>
            </Flex>
        </>
    );
}
function StateCheckboxes({table}) {
    return (
        <RadioGroup>
            <Flex direction={'column'}>
                <CompletedCheckbox table={table}></CompletedCheckbox>
                <Checkbox onChange={(e)=>{
                    window.DB.getGeneralRaw(
                        `update ${table.tableNameRef.current}
                        set processing_state=${e.target.checked ? 2 : 0}
                        where id=${table.fullData[table.detailsTarget].id}`
                    );
                }}>Producting</Checkbox>
            </Flex>
        </RadioGroup>
    )
}

export default function ProductionTab({outer_onRowClick = ()=>{}}) {
    const productionTable = useTableState({sort:{target:'date',direction:-1},filters:[]},'production');
    const tableOptions = useTableOptions('production');
    const processingTypes = useProcessingTypes();

    const innerMaterials = useRef([]);
    
    const editTarget = useRef(-1);
    const editInitValues = useRef({});

    const isTabControlable = (window.sessionStorage.getItem('task') == 2);

    // productionTable.
    function updateTable() {
        (async ()=>{
            let Rows = ['production.id','production.date','production.deadline_date','production.weight','production.waste','materials.material','trades.material_count'];
            let RowsMasks = ['id','date','deadline date', 'weight', 'waste', 'material', 'count'];
            let data = await window.DB.getGeneralRaw(`
                SELECT ${Rows.join(',')} FROM production
                    left join logistics on logistics.id=production.logistics_id
                    left join trades on trades.id=logistics.trade_id
                    left join materials on trades.material_id=materials.id
                ${SQLFilterCondition(productionTable.colState.filters)}
                ${SQLOrderCondition(productionTable.colState.sort)}
            `);
            let fullData = await window.DB.getGeneralRaw(`
                select production.*,materials.material,materials.material_type,trades.material_count from production
                    left join logistics on logistics.id=production.logistics_id
                    left join trades on trades.id=logistics.trade_id
                    left join materials on trades.material_id=materials.id
                ${SQLFilterCondition(productionTable.colState.filters)}
                ${SQLOrderCondition(productionTable.colState.sort)}
            `);
            productionTable.setData(data);
            productionTable.setFullData(fullData);

            productionTable.setRowsMasks(RowsMasks);
            productionTable.setRows(Rows);
            
        })()
    }
    const lastData = useRef({});
    useEffect(()=>{
        return DataUpdateCheck(updateTable,lastData,'production');
    },[]);
    useEffect(()=>{
        updateTable();
        (async ()=>{
          let colors = await GetTableColors('production');
          processingTypes.setColors(colors);
        })();
    },[productionTable.DetailsDisclosure.isOpen,productionTable.AddDisclosure.isOpen,productionTable.colState]);

    return (
    <>
        <DataTable tableState={productionTable} colors={processingTypes.colors} onRowClick={async (data,i)=>{
            innerMaterials.current = (await window.DB.getGeneralRaw(`
                select in_mat.id as id,materials.material,in_mat.production_id,in_mat.count from production_inner_materials as in_mat
                join materials on materials.id=in_mat.inner_material_id
                where in_mat.production_id=${data.id}
            `));
            productionTable.DetailsDisclosure.onOpen();
            productionTable.setDetailsTarget(i);
            outer_onRowClick(data);
        }}/>
        <DetailedDescription disclosure={productionTable.DetailsDisclosure} onDelete={()=>{
            window.DB.getGeneralRaw(`delete from production where id=${productionTable.fullData[productionTable.detailsTarget].id}`);
        }} onEdit={isTabControlable ? ()=>{
            editTarget.current = productionTable.fullData[productionTable.detailsTarget].id;
            editInitValues.current = {weight:productionTable.fullData[productionTable.detailsTarget].weight,waste:productionTable.fullData[productionTable.detailsTarget].waste,date:productionTable.fullData[productionTable.detailsTarget].date};
            productionTable.AddDisclosure.onOpen();            
        } : undefined} tableState={productionTable} isStateSetterVisibile={isTabControlable} StateCheckboxes={StateCheckboxes}>
            <ProductionDescription productionTable={productionTable} innerMaterials={innerMaterials} controlable={isTabControlable}/>
        </DetailedDescription>
        <ProductionAdder disclosure={productionTable.AddDisclosure} target_id={editTarget.current} inpsInitValues={editInitValues.current}/>
    </>);
}