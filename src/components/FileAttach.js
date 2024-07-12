import { Button, Flex, Link } from "@chakra-ui/react";
import React from "react";



function FileAttach({table, haveControl = true, attachFunc}) { 
    
    return (
        <Flex direction={'column'} justifyItems={'center'}>
            <Flex direction={'column'} fontSize={12}>
                {table.files.map((file,i)=>{
                    return <Link key={i} onClick={()=>{window.Files.openFolder(file)}}>{file}</Link>
                })}
            </Flex>
            <Flex alignItems={'center'} hidden={!haveControl}>
                <label htmlFor="file_selector">
                    <Flex className="chakra-button css-11494p6">Attach files</Flex>
                </label>
                <input id="file_selector" type="file" multiple hidden onChange={(e)=>{
                    let files = [];
                    for (let file of e.target.files) {files.push(file.path);}
                        attachFunc(files,table.fullData[table.detailsTarget].id);
                        table.setFiles(files);
                    }}
                />
                <Button variant={'outline'} onClick={()=>{attachFunc([],table.fullData[table.detailsTarget].id);table.setFiles([]);}}>Clear files</Button>
            </Flex>
        </Flex>
    );
}
export {FileAttach}