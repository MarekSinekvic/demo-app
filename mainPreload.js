let { contextBridge, ipcRenderer } = require("electron")


contextBridge.exposeInMainWorld('DB', {
    tryReconnect() {
        return ipcRenderer.invoke('try-reconnect');
    },
    checkError() {
        return ipcRenderer.invoke('check-error');
    },
    getGeneralRaw(query) {
        return ipcRenderer.invoke('get-general-raw',query);
    },
    getGeneral(table, columns, filters = [], order = {target:"id",direction:1}, additional = '') {
        return ipcRenderer.invoke("get-general", table,columns,filters,order, additional);
    },
    setGeneral(table, target, condition) {
        return ipcRenderer.invoke('set-general', table, target, condition);
    },
    getTableDescr(table,target) {
        return ipcRenderer.invoke('get-descr', table);
    },
    getUsers: ()=>ipcRenderer.invoke("get-users"),
    getTasks: ()=>ipcRenderer.invoke("get-tasks"),

    getTrades: ()=>ipcRenderer.invoke("get-trades"),
    getLogistics: ()=>ipcRenderer.invoke("get-logistics"),

    addUser(name,password,task) {return ipcRenderer.invoke("add-user",name,password,task);},
    removeUserById(id) {return ipcRenderer.invoke("remove-user",id);},

    getUserByLogin(name,password) {return ipcRenderer.invoke("get-user-by-login",name,password)}
});
contextBridge.exposeInMainWorld('Files', {
    openFolder: (path)=>{
        return ipcRenderer.invoke('open-folder',path);
    },
    saveBarcode: (svg,path='/')=>{
        return ipcRenderer.invoke('save-barcode-svg',svg,path)
    }
});