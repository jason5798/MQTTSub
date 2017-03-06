var moment = require('moment');
var JsonFileTools =  require('./jsonFileTools.js');
//var ParseDefine =  require('./parseDefine.js');
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
var obj;
var path = './public/data/finalList.json';
var finalList = {};

function init(){
    finalList = JsonFileTools.getJsonFromFile(path);
}

init();

exports.parseMsg = function (msg) {
    if(getType(msg) === 'array'){
        obj = msg[0];
        console.log('msg array[0] :'+JSON.stringify(obj));
    }else if(getType(msg) != 'object'){
        try {
			obj = JSON.parse(msg.toString());
		}
		catch (e) {
			console.log('msgTools parse json error message #### drop :'+e.toString());
			return null;
		}
    }else{
        obj = msg;
    }
    //Get data attributes
    mData = obj.data;
    mMac  = obj.macAddr;
    if(obj.recv){
        mRecv = obj.recv;
    }else
    {
        mRecv = obj.time;
    }
    
    mDate = moment(mRecv).format('YYYY/MM/DD HH:mm:ss');
    mTimestamp = new Date(mRecv).getTime();
    delete obj.data;
    delete obj.macAddr;
    delete obj.time;
    mInfo = obj;

    var msg = {mac:mMac,data:mData,recv:mRecv,date:mDate,information:mInfo,timestamp:mTimestamp};
    finalList[mMac]=msg;
    return msg;
}

exports.setFinalList = function (list) {
    finalList = list;
}

exports.getFinalList = function () {
    return finalList;
}

exports.saveFinalListToFile = function () {
    /*var json = JSON.stringify(finalList);
    fs.writeFile(path, json, 'utf8');*/
    JsonFileTools.saveJsonToFile(path,finalList);
}



/*function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}*/

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

