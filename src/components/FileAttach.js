import { Button, Flex, Link } from "@chakra-ui/react";
import React from "react";


async function attachFiles(files,row_id,sqlTableName,sqlIdName) {
    await window.DB.getGeneralRaw(`
      delete from ${sqlTableName}
      where ${sqlIdName}=${row_id}
    `);
    files.map(async (file)=>{
      file = file.split('\\').join('\\\\');
      let file_id = (await window.DB.getGeneralRaw(`
        replace into files_links (file_path)
        values ('${file}')
      `)).insertId;
      window.DB.getGeneralRaw(`
        insert into ${sqlTableName} (${sqlIdName},file_id) values (${row_id},${file_id})
      `);
    });
  }
function FileAttach({files,filesSetter, haveControl = true, attachFunc = (files,rowId)=>{}, clearFiles = (rowId)=>{}}) { 
    
    return (
        <Flex direction={'column'} justifyItems={'center'}>
            <Flex direction={'column'} fontSize={12}>
                {files.map((file,i)=>{
                    return <Link key={i} onClick={()=>{window.Files.openFolder(file)}}>{file}</Link>
                })}
            </Flex>
            <Flex alignItems={'center'} hidden={!haveControl}>
                <label htmlFor="file_selector">
                    <Flex className="chakra-button css-11494p6">Attach files</Flex>
                </label>
                <input id="file_selector" type="file" multiple hidden onChange={(e)=>{
                    let nfiles = [...files];
                    for (let file of e.target.files) {nfiles.push(file.path);}
                    attachFunc(nfiles);
                    filesSetter(nfiles);
                }}
                />
                <Button variant={'outline'} onClick={()=>{clearFiles(); filesSetter([]);}}>Clear files</Button>
            </Flex>
        </Flex>
    );
}
export {FileAttach,attachFiles}