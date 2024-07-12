import react, { Children, useEffect, useId, useRef, useState } from 'react';

import {Drawer,DrawerBody,DrawerFooter,DrawerHeader,DrawerOverlay,DrawerContent,CloseButton, Stack, useDisclosure, Input, Checkbox, Text} from '@chakra-ui/react';
import { Flex,Button } from '@chakra-ui/react';
import React from 'react';
import { ReactBarcode } from 'react-jsbarcode';

function ChangeableText({children, onApply = ()=>{},style={}}) {
  const [isChanging, setChanging] = useState(false);

  return (
    <Flex direction={'row'} style={style}>
      {isChanging ? 
        <Input size={'sm'} variant={'flushed'} h={'auto'} defaultValue={children} autoFocus onKeyDown={(e)=>{
          if (e.key == 'Enter') {
            onApply(e.target.value);
            setChanging(false);
          }
          if (e.key == 'Escape') {
            setChanging(false);
          }
        }}></Input>
      : <span onDoubleClick={()=>{setChanging(true)}} style={{fontStyle:'italic'}}>{children}</span>}
    </Flex>
  );
}
function DrawerFullData({tableState}) {
  return (
    <Flex gap={10}>
      <Flex direction={'column'}>
        {Object.keys(tableState.fullData[tableState.detailsTarget]).map((v,i)=>{
          return (<span key={i}>{v}</span>);
        })}
      </Flex>
      <Flex direction={'column'}>
        {Object.keys(tableState.fullData[tableState.detailsTarget]).map((v,i)=>{
          return <ChangeableText key={i} onApply={(value)=>{tableState.changeFullData(tableState.detailsTarget,{[v]:`${value}`});}}>{String(tableState.fullData[tableState.detailsTarget][v])}</ChangeableText>;
        })}
      </Flex>
    </Flex>
  );
}
function DetailedDescription({children,disclosure, isStateSetterVisibile = true, onDelete=()=>{}, tableState=undefined, onEdit=undefined}) {  
    // useEffect(()=>{console.log(data);},[data]);
    const [procState,setProcState] = useState(0);
    const barcodeRef = useRef(null);
    const barcodeData = useRef('0');
    useEffect(()=>{
      if (typeof (tableState) != 'undefined') {
        if (tableState.fullData.length > 0) {
          (async ()=>{
            let state = await window.DB.getGeneralRaw(`select processing_state from ${tableState.tableNameRef.current} where id=${tableState.fullData[tableState.detailsTarget].id}`);
            if (state.length>0)
              setProcState(state[0].processing_state);
          })();
          const row = tableState.fullData[tableState.detailsTarget];
          barcodeData.current = `${row.id}`;
        }
      }
    },[disclosure.isOpen]);
    return (
      <Drawer placement="bottom" onClose={disclosure.onClose} isOpen={disclosure.isOpen} size={"xl"}>
        <DrawerOverlay/>
        <DrawerContent>
          <DrawerHeader>
            <Flex justifyContent={"space-between"}><>Detailed description</><CloseButton onClick={disclosure.onClose}/></Flex>
          </DrawerHeader>
          <DrawerBody>
            {children}
          </DrawerBody>
          <DrawerFooter>
            <Stack direction={'row'} justifyContent={'space-between'} w={'100%'}>
              {/* <Button>Edit</Button> */}
              <Button bg={'rgb(205,50,50)'} color={'white'} onClick={()=>{onDelete(); disclosure.onClose()}}>Delete</Button>
              <Stack direction={'row'} alignItems={'center'}>
                {isStateSetterVisibile ? (<><Checkbox isChecked={procState} onChange={(e)=>{
                  if (typeof (tableState) == 'undefined') return;
                  window.DB.getGeneralRaw(
                    `update ${tableState.tableNameRef.current}
                    set processing_state=${e.target.checked}
                    where id=${tableState.fullData[tableState.detailsTarget].id}`
                  );
                  setProcState(e.target.checked);
                }}/><Text>Completed</Text></>) : ('')}
                {/* <Button p={0} variant={'ghost'} onClick={()=>{
                  window.Files.saveBarcode(barcodeRef.current.children[0].outerHTML);
                }}>
                  <div ref={barcodeRef}><ReactBarcode value={barcodeData.current} options={{format:'MSI',width:2,height:30,fontSize:'10px'}} renderer='svg' className='barcode'></ReactBarcode></div>
                </Button> */}
                {typeof (onEdit) != 'undefined' ? (<Button variant={'outline'} onClick={()=>{onEdit(); disclosure.onClose()}}>Edit</Button>) : ''}
                <Button onClick={()=>{disclosure.onClose()}} variant={'outline'}>Cancel</Button>
              </Stack>
            </Stack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>);
  }
  export {DetailedDescription,DrawerFullData,ChangeableText};