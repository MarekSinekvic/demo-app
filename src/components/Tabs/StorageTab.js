import React, { useEffect, useState } from "react";
import { DataTable, SQLFilterCondition, SQLOrderCondition, useModalStyler, useTableOptions, useTableState } from "../DataTable";
import { DetailedDescription, DrawerFullData } from "../DetailedDescription";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack } from "@chakra-ui/react";

function StorageAdder({closure,storageTarget=0}) {
    const initValues = {material:'',count:0};
    const storageModal = useModalStyler(closure,initValues,(values)=>{
        console.log(values);
        (async ()=>{
            let matId = (await window.DB.getGeneralRaw(`insert into materials (material,material_type) values ('${values.material}',${storageTarget})`)).insertId;
            await window.DB.getGeneralRaw(`insert into storage (material_id,count) values (${matId},${values.count})`);
        })();
    });
    return (
        <Modal isOpen={closure.isOpen} onClose={closure.onClose}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>Add to storage</ModalHeader>
                <ModalBody>
                    <Stack direction={'row'}>
                        <Input placeholder="Material" w={'80%'} onChange={(e)=>{storageModal.setValues({...storageModal.values,material:e.target.value})}}></Input>
                        <Input type="number" placeholder="Count" w={'20%'} onChange={(e)=>{storageModal.setValues({...storageModal.values,count:Number(e.target.value)})}}></Input>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Stack direction={'row'}>
                        <Button variant={'outline'} onClick={storageModal.acceptValues}>Add</Button>
                        <Button onClick={()=>{closure.onClose()}}>Cancel</Button>
                    </Stack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

function StorageTab({outer_onRowClick=()=>{},style={}}) {
    const storageTableInner = useTableState({},'storage');
    const storageTableOuter = useTableState({},'storage');

    const tableOptions = useTableOptions('storage');

    const [storageTarget, setStorageTarget] = useState(0);
    useEffect(()=>{
        (async ()=>{
            let Rows = ['storage.id','mats.material','count'];
            let data = await window.DB.getGeneralRaw(`
                SELECT ${Rows.join(',')} FROM storage
                join materials as mats on storage.material_id=mats.id
                ${SQLFilterCondition(storageTableInner.colState.filters,['mats.material_type=0'])}
                ${SQLOrderCondition(storageTableInner.colState.sort)}
            `);
            let fullData = await window.DB.getGeneralRaw(`
                select storage.* from storage
                join materials as mats on storage.material_id=mats.id
                ${SQLFilterCondition(storageTableInner.colState.filters,['mats.material_type=0'])}
                ${SQLOrderCondition(storageTableInner.colState.sort)}
            `);
            storageTableInner.setData(data);
            storageTableInner.setFullData(fullData);
            storageTableInner.setRows(Rows);
        })();
    },[storageTableInner.colState]);
    useEffect(()=>{
        
        (async ()=>{
            let Rows = ['storage.id','mats.material','count'];
            let data = await window.DB.getGeneralRaw(`
                SELECT ${Rows.join(',')} FROM storage
                join materials as mats on storage.material_id=mats.id
                ${SQLFilterCondition(storageTableInner.colState.filters,['mats.material_type=1'])}
                ${SQLOrderCondition(storageTableInner.colState.sort)}
            `);
            let fullData = await window.DB.getGeneralRaw(`
                select storage.* from storage
                join materials as mats on storage.material_id=mats.id
                where material_type=1
            `);
            storageTableOuter.setData(data);
            storageTableOuter.setFullData(fullData);
            storageTableOuter.setRows(Rows);
        })();
    },[storageTableOuter.colState]);

    return (
    <Stack direction={'row'}>
        <DataTable style={{width:'50%'}} tableState={storageTableInner} caption="inner materials" onRowClick={(data,i)=>{
            storageTableInner.DetailsDisclosure.onOpen();
            storageTableInner.setDetailsTarget(i)}} onRowAdd={()=>{setStorageTarget(0)}}/>
        <DetailedDescription disclosure={storageTableInner.DetailsDisclosure}>
            <DrawerFullData tableState={storageTableInner} targetIndex={storageTableInner.detailsTarget}></DrawerFullData>
        </DetailedDescription>

        <DataTable style={{width:'50%'}} tableState={storageTableOuter} caption="outer materials" onRowClick={(data,i)=>{
            storageTableOuter.DetailsDisclosure.onOpen();
            storageTableOuter.setDetailsTarget(i)}} onRowAdd={()=>{setStorageTarget(1); storageTableInner.AddDisclosure.onOpen()}}/>
        <DetailedDescription disclosure={storageTableOuter.DetailsDisclosure}>
            <DrawerFullData tableState={storageTableOuter} targetIndex={storageTableOuter.detailsTarget}></DrawerFullData>
        </DetailedDescription>

        <StorageAdder closure={storageTableInner.AddDisclosure} storageTarget={storageTarget}></StorageAdder>

    </Stack>);
}
export default StorageTab;