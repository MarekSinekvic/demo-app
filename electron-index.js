console.log("Start");

const { app, BrowserWindow, ipcMain, autoUpdater, dialog } = require('electron');
const utils = require('util');
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const { convert,convertFile } = require('convert-svg-to-png');

let mysql_options = {
    host: "localhost",
    user: 'root',
    port: 3306,
    password: '',
    fileName: 'mysql_options.json'
};
const barcodesFolderPath = path.join(__dirname,'/barcodes/');
function checkMysqlOptions() {
    let mysql_options_path = path.join(__dirname,mysql_options.fileName);
    console.log(mysql_options_path);
    if (fs.existsSync(mysql_options_path)) {
        let data = fs.readFileSync(mysql_options_path,{encoding:'utf-8'});
        mysql_options = JSON.parse(data);
    } else {
        fs.appendFile(mysql_options_path, JSON.stringify(mysql_options),(err)=>{console.log(err);});
    }
}
checkMysqlOptions();

const updateServer = 'https://demo-app-jnbk58pu0-mareksinekvics-projects.vercel.app';
const updateUrl = `${updateServer}/update/${process.platform}/${app.getVersion()}`;
autoUpdater.setFeedURL({url:updateUrl});
function checkUpdates() {
    autoUpdater.checkForUpdates();
    autoUpdater.on('update-available',(e)=>{
        console.log('UPDATE');
        console.log(e);
        dialog.showMessageBox({
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: 'test message from verlet',
            detail:
              'A new version available. Restart the application to apply the updates.'
          }).then((res)=>{
            console.log(res);
          });
    });
    autoUpdater.on('update-downloaded',(e)=>{
        console.log('UPDATE');
        console.log(e);
        dialog.showMessageBox({
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: 'test message from verlet',
            detail:
              'downloaded new version'
          }).then((res)=>{
            console.log(res);
            autoUpdater.quitAndInstall();
          });
    });
}
// checkUpdates();

let DBError = null;
let db = mysql.createConnection({
    host: mysql_options.host,
    user: mysql_options.user,
    password: mysql_options.password,
    port: mysql_options.port
});
db.connect((e)=>{
    DBError = e;
    console.log("Connection errors - "+e);
    db.query("use demoapp");
});

let aquery = utils.promisify(db.query).bind(db);

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname,'mainPreload.js'),
        }
    });
    console.log(path.join(__dirname,'mainPreload.js'));
    win.setMenuBarVisibility(false);
    win.maximize();
    
    console.log(process.env.NODE_ENV);
    win.loadURL("http://localhost:3000");
    // process.env.NODE_ENV == "development" ? win.loadURL("http://localhost:3000") : win.loadFile(path.join(__dirname,"build/index.html"));
    win.webContents.openDevTools();


}

let dbIpcHandlers = {
    "try-reconnect": async (ev) => {
        checkMysqlOptions();
        db = mysql.createConnection({
            host: mysql_options.host,
            user: mysql_options.user,
            password: mysql_options.password,
            port: mysql_options.port
        });
        db.connect((e)=>{
            DBError = e;
            db.query('use demoapp');
            console.log(e);
        });
        aquery = utils.promisify(db.query).bind(db);
        return DBError;
    },
    "check-error": async (ev) => {
        return DBError;
    },
    "get-users": async (ev) => {
        let result = await aquery("select * from users");
        return result;
    },
    "get-tasks": async (event) => {
        let result = await aquery("select * from user_tasks");
        return result;
    },
    "add-user": async (ev,name, password,task) => {
        // console.log(`insert into users (name,task) values (${name},${task})`);
        let result = await aquery(`insert into users (name,password,task) values ('${name}','${password}','${task}')`);
        return result;
    },
    "remove-user": async (ev,id) => {
        let result = await aquery(`delete from users where id=${id}`);
        return result;
    },
    "get-trades": async (ev) => {
        let result = await aquery("select * from trades");
        // console.log(result);
        return result;
    },
    "get-logistics": async (ev) => {
        let result = await aquery("select * from logistics");
        return result;
    },
    "get-user-by-login": async (ev,name,password) => {
        // let result = await aquery(`select * from users where (\`name\`='${name}' and \`password\`='${password}')`);
        let result = await aquery(`select * from users where (\`name\`=? and \`password\`=?)`, [name,password]);
        return result;
    },
    "get-general-raw": async (ev, query) => {
        let result = await aquery(query);
        console.log(query);
        return result;
    },
    "get-general": async (ev, table,target,filters,order, additional = '') => {
        let filtersValues = 0;
        let filterCondition = [];
        filters.map((v,i)=>{
            let value = v.value;
            if (isNaN(value)) value = '\''+value+'\''; else value = Number(value);
            if (typeof (v.comparison) == 'undefined') v.comparison = '=';
            if (v.value != '') {filtersValues++; filterCondition.push(`\`${v.target}\` ${v.comparison} ${value}`);}
        });
        if (Object.keys(order).length == 0) {
            order.target = 'id';
            order.direction = 1;
        }
        // console.log(filters, filterCondition);
        let filterConditionStr=filterCondition.join(' and ');
        let query = `select ${target} from ${table} 
                    ${((filters.length > 0 && filtersValues > 0) ? 'where ('+filterConditionStr+")" : '')}
                    ${additional}
                    order by ${order.target} ${(order.direction == 1) ? 'ASC' : 'DESC'}`;
        console.log(query);
        let result = await aquery(query);

        return result;
    },
    'set-general': async (ev, table,setter,condition = '') => {
        if (condition.length > 0) condition = `where ${condition}`;
        let query = `update ${table} set ${setter} ${condition}`;
        let result = await aquery(query);
        return result;
    },
    "get-descr": async (ev,table) => {
        let result = await aquery(`describe ${table}`);

        return result;

    }
}; 

app.on("ready",() => {
    for (let prop in dbIpcHandlers) {
        ipcMain.handle(prop,dbIpcHandlers[prop]);
    }
    ipcMain.handle('open-folder',(ev,path)=>{
        require('child_process').exec(`start "" "${path}"`);
    });
    ipcMain.handle('save-barcode-svg',(ev,svg)=>{
        // require('child_process').exec(`start "" "${path}"`);
        if (!fs.existsSync(barcodesFolderPath))
            fs.mkdirSync(barcodesFolderPath);
        let folderBarcodes = fs.readdirSync(barcodesFolderPath);
        let filePath = path.join(barcodesFolderPath,`${folderBarcodes.length}.svg`);
        fs.writeFileSync(filePath,svg);

        (async ()=>{
            const pngFilePath = await convertFile(filePath);

            require('child_process').exec(`start "" "${pngFilePath}"`);
        })();
    });
    createWindow();
})