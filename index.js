#!/usr/bin/env node

const inquirer = require('inquirer');
const admin =require('firebase-admin');
const caporal = require('caporal');
const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs');
const readline = require('readline-sync');
var database;
var db_list="";
var serviceKeyPath;
var type;
var path = "/";
var accessApp;    // 여러 앱을 초기화 하기 위한 즉 , 두번째 admin 을 담을 변수

//=====================================================================================================================

caporal
    .version('0.0.1')
    .command('init' ,'setup of project')
    .action((args, options, logger) => {
        console.log(
            chalk.yellow(
                figlet.textSync('Blu-Firebase-CLI',{horizontalLayout:'full'})
            )
        );
        console.log("\n\n");
        console.log("Blu-firebase-api module initialize in this directory");
        console.log("\n\n");
        input();
    })
    .command('database' , 'access to database')
    .action((args, options, logger) => {

        checkInit(false)
            .then(function (text) {
                // 성공시
                var information = readInfoJson();
                selectDB(information);
            }, function (error) {
                // 실패시
                console.error("you need to initialize  : --help");
            });
    });
caporal.parse(process.argv);


// ======================================= about init ======================


function input(){

    serviceKeyPath = readline.question("Input Service key's absolute path : ");
    db_list = readline.question("Input database list path : (bluelens-browser/db_list) ");
    if(db_list.length == 0 ){db_list = "bluelens-browser/db_list";}

    var info = {'serviceKeyPath': serviceKeyPath, 'datbaseList' : db_list};

    fs.writeFile("./blu-firebase-info.json", JSON.stringify(info), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("save blu-firebase-info.json finish in this directory");
        process.exit(0);
    });

}


function checkInit (param) {
    return new Promise(function (fulfill, reject) {
        var isInit = false;
        fs.readdir('./', (err, files) => {
            files.forEach(file =>{
                if(file == 'blu-firebase-info.json') { //json 파일만 걸러냄
                    isInit =true;
                }
            });
            if (!isInit) reject(err);
            else fulfill(isInit);
        });
    });
}


function adminInitialize(serviceKeyPath,database){
try {

    var serviceAccount = require(serviceKeyPath);
}catch (e) {
    console.log("\n\nservice key is not exist, please check serviceKeyPath in blu-firebase-info.json\n\n");
    process.exit(0);
}
       accessApp =  admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'https://' + database + '.firebaseio.com'
        },'other');

}
// ======================================= about database ===================

function selectDB(info){
    var dblist = info.datbaseList.split("/");
    try {
        var serviceAccount = require(info.serviceKeyPath);
    }catch (e) {
        console.log("\n\nservice key is not exist, please check serviceKeyPath in blu-firebase-info.json\n\n");
        process.exit(0);
    }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'https://' + dblist[0] + '.firebaseio.com'
        });


    var list = [];

    var db = admin.database();
    var ref = db.ref();
    return ref.child('/'+dblist[1]).once('value').then((snapshot)=> {
        snapshot.forEach(function (childSnapshot) {
            list.push(childSnapshot.key);
        });
        if(list.length == 0 ){
            console.log("Dabase is not exist in this project");
            process.exit(0);
        }
        inquirer.prompt([{
            type: 'list',
            name: 'database',
            message: 'Select database what you want to access\n',
            choices: list
        }]).then(answers => {
            var jsonAnswer = JSON.parse(JSON.stringify(answers));
            var database = jsonAnswer.database;
            adminInitialize(info.serviceKeyPath,database);  // 선택된 데이터베이스를 기반으로 admin sdk 를 초기화 시킨다
            doSelect();  // 초기화된 admin sdk(accessApp) 을통해 import or export를 선택하고 child를 선택한다.
        });;

    });
}

function doSelect(){
    inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'What do you want to do?',
            choices: [
                'Import Json File To Firebase',
                'Export Json File From Firebase'
            ]
        }
    ]).then(answers =>{
        var jsonAnswer = JSON.parse(JSON.stringify(answers));
        type = jsonAnswer.type;
        getChildList(path);
    });
}




function getChildList(path){
    var list = [];

        var db = accessApp.database();
        var ref = db.ref();

    return ref.child(path).once('value').then((snapshot)=> {
        snapshot.forEach(function (childSnapshot) {
            list.push(childSnapshot.key);
        });
        if(list.length == 0 ){
            console.log("version child is not exist");
            process.exit(0);
        }
        inquirer.prompt([{
            type: 'list',
            name: 'child',
            message: 'Select child\n',
            choices: list
        }]).then(answers => {
            var jsonAnswer = JSON.parse(JSON.stringify(answers));
            path = path +jsonAnswer.child + "/";
            if(jsonAnswer.child.indexOf("v_") != -1) {
                if(type.indexOf("Import") != -1 ){selectJsonFile(path);}
                if(type.indexOf("Export") != -1 ){exportJsonFromFirebase(path , jsonAnswer.child);}
                return;}

            // console.log(path);
            getChildList(path);
        });;

    });
}


function exportJsonFromFirebase(path , filename){
    var list = [];
    var db = accessApp.database();
    var ref = db.ref();

    return ref.child(path).once('value').then((snapshot)=> {
        // console.log(snapshot.val());
        fs.writeFile("./"+filename+".json", JSON.stringify(snapshot.val()), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            process.exit(0);
        });

    });

}


function selectJsonFile(path) {
    var list = [];
    fs.readdir('./', (err, files) => {
        files.forEach(file =>{
            if(file.indexOf('.json') != -1) { //json 파일만 걸러냄
                list.push(file);
            }
        });
        inquirer.prompt([
            {
                type: 'list',
                name: 'file',
                message: 'Select JSON File\n',
                choices: list
            }
            ]).then(answers =>{
                var jsonAnswer = JSON.parse(JSON.stringify(answers));
                var obj = JSON.parse(fs.readFileSync(jsonAnswer.file, 'utf8'));
                importJsonToFirebase(path,obj);
            })

    });
}
function importJsonToFirebase(path, jsonFileContent){
    var db = accessApp.database();
    var ref = db.ref(path);

    setTimeout (function () {
        ref.set(jsonFileContent);
        console.log ( "finish set json data");
        process.exit(0);
    }, 2000);
}



function readInfoJson(){
    var information = JSON.parse(fs.readFileSync('blu-firebase-info.json','utf8'));
    return information;
}