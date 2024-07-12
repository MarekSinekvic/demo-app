import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, useDisclosure } from "@chakra-ui/react";
import React, { useRef } from "react";

function useSimpleAdder({DataList = {}}) {
    const closure = useDisclosure();
    const newData = useRef({});
    for (let name in DataList) {
        newData.current[name] = DataList[name];
    }

    return {closure,...newData.current};
}

function SimpleAdderModal({children, closure, onAdd}) {

    return (
        <>
            <Modal isOpen={closure.isOpen} onClose={closure.onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Add to list</ModalHeader>
                    <ModalBody>
                        {children}
                    </ModalBody>
                    <ModalFooter>
                        <Stack direction={'row'}>
                            <Button onClick={()=>{closure.onClose(); onAdd()}}>Add</Button>
                            <Button onClick={closure.onClose}>Cancel</Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
export {SimpleAdderModal,useSimpleAdder};