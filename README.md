# Blu firebase : CLI

[![npm version](https://badge.fury.io/js/blu-firebase-cli.svg)](https://badge.fury.io/js/blu-firebase-cli)
<a href="https://gitter.im/ApiWay/apiway-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge"><img src="https://badges.gitter.im/Join Chat.svg" alt="Gitter chat" height="20"></a>

[![NPM](https://nodei.co/npm/blu-firebase-cli.png)](https://nodei.co/npm/blu-firebase-cli/)

Command Line Interface for import/export Json file from Firebase Realtime Dataabase


## About blu-firebase-cli
Firebase Project 내의 Default database 이외의 database에 json file을 set/get하기위한 Command Line Interface
#### Problem
* 현재 firebase-tools를 활용한 Firebase Realtime Database에 대한  database:set, databse:get(import/export json file)은 default database에 제한되어 있다.
#### Solution
* firebase-admin package와 service account key를 통해 database 접근과 Json형식의 Data get,set  


## Installation
```shell
$ npm install blu-firebase-cli -g
```

## Usage
### Init
Default git provider is Github
```shell
$ blu init
```

### database
Default git provider is Github
```shell
$ blu database
```

