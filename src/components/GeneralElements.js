import { Grid, GridItem, Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader, PopoverTrigger, Link, Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

function placeArrayUnq(arr,value) {
  if (arr.includes(value))
    return arr;
  else
    return [...arr,value];
}
function removeArrayUnq(arr = [],value) {
  let index = arr.findIndex((v)=>{return v==value});
  if (index != -1)
    return [...arr.slice(0,index),...arr.slice(index+1,arr.length-1)];
  return arr;
}
function toggleArrayUnq(arr = [],value = '') {
  if (arr.includes(value)) {
    arr = removeArrayUnq(arr,value);
  } else {
    arr = placeArrayUnq(arr,value);
  }
  return arr;
}
function DetailsPopover({children,targetTable}) {
    const [colNames,setColNames] = useState([]);
    const [row,setRow] = useState([]);
    useEffect(()=>{
      (async ()=>{
        let rowData = await window.DB.getGeneralRaw(`select * from ${targetTable} where company='${children}'`);
        let colData = await window.DB.getGeneralRaw(`describe ${targetTable}`);
        
        setColNames(colData.map((v)=>{return v.Field}));
        setRow(rowData);
      })();
    },[]);
    return (
      <Popover>
        <PopoverTrigger>
          <Link>{children}</Link>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            {children}
          </PopoverHeader>
          <PopoverBody>
            {/* <Grid templateColumns={`repeat(${colNames.length},${100/colNames.length}%)`} templateRows={`auto auto`}>
              {colNames.map((data,i)=>{
                return (<GridItem key={i} style={{textTransform:'uppercase'}}>{data}</GridItem>);
              })}
              {(row.length > 0) ? Object.keys(row[0]).map((data,i)=>{
                return (<GridItem key={i}>{row[0][data]}</GridItem>);
              }) : ''}
            </Grid> */}
            <Flex direction={'row'} justifyContent={'space-between'} width={'100%'}>
            {colNames.map((data,i)=>{
                return (
                  <Flex key={i} direction={'column'}>
                    <Flex style={{textTransform:'uppercase'}}>{data}</Flex>
                    
                    <Flex>
                      {(row.length > 0) ? (<Flex>{row[0][data]}</Flex>) : ''}
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
}
export {DetailsPopover,placeArrayUnq,removeArrayUnq,toggleArrayUnq};