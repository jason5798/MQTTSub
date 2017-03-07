var moment = require('moment');
var ParseBlaziong =  require('./parseBlaziong.js');
var ParseDefine =  require('./parseDefine.js');
var JsonFileTools =  require('./jsonFileTools.js');
var listDbTools =  require('./listDbTools.js');
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
var obj;
var path = './public/data/finalList.json';
var finalList = {};
var overtime = 24;
var hour = 60*60*1000;
var mac_tag_map = {};
var type_tag_map = {};
var type_time_map = {};

function init(){
    //finalList = JsonFileTools.getJsonFromFile(path);
    listDbTools.findByName('finalist',function(err,lists){
        if(err)
            return;
        finalList = lists[0].list;
    });
}

init();

exports.parseMsg = function (msg) {
    console.log('MQTT message :\n'+JSON.stringify(msg));
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
    mDate = moment(mRecv).format('YYYY/MM/DD HH:mm:ss');
    mExtra = obj.extra;
    if(obj.recv){
        mRecv = obj.recv;
    }else
    {
        mRecv = obj.time;
    }
    mTimestamp = new Date(mRecv).getTime();

    
    //Parse data
    if(mExtra.fport>0 ){
        mInfo = parseBlazingMessage(mData,mExtra.fport);
    }else{
        if(isSameTagCheck(mType,mMac,msg.recv))
            return null;
        if(mType.indexOf('aa')!=-1)
            mInfo = parseDefineMessage(mData,mType);
    }

    var msg = {mac:mMac,data:mData,recv:mRecv,date:mDate,information:mInfo,extra:mExtra,timestamp:mTimestamp};
    
    if(mExtra.fport>0 ){
        saveBlazingList(mExtra.fport,mMac,msg)
    }else{
        finalList[mMac]=msg;
    }
    
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

function saveBlazingList(fport,mac,msg){
    var key = "gps";
    delete msg.information;
    
    //for blazing
    if(fport === 3 || fport === 1){//GPS
        key = "gps";
    }else if(fport === 19){//PIR
        key = "pir";
    }else if(fport === 11){//PM2.5
        key = "pm25";
    }else if(fport === 21){//Flood
       key = "flood";
    }
    if(finalList[key] === undefined){
        finalList[key] = {};
    }
    //console.log('finalList1 :'+JSON.stringify(finalList));
    finalList[key][mac] = msg;
    //console.log('finalList2 :'+JSON.stringify(finalList));
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}

function parseBlazingMessage(data,fport){
    var mInfo = {};
    
    //for blazing
    if(fport === 3 || fport === 1){//GPS
        mInfo = ParseBlaziong.getTracker(data);
    }else if(fport === 19){//PIR
        mInfo = ParseBlaziong.getPIR(data);
    }else if(fport === 11){//PM2.5
        mInfo = ParseBlaziong.getPM25(data);
    }else if(fport === 21){//Flood
        mInfo = ParseBlaziong.getFlood(data);
    }
    return mInfo;
}

//type_tag_map is local JSON object
function isSameTagCheck(type,mac,recv){
	var time =  moment(recv).format('mm');
	
	//Get number of tag
	var tmp = mData.substring(4,6);
	var mTag = parseInt(tmp,16)*100;//流水號:百位
        mTag = mTag + parseInt(time,10);//分鐘:10位及個位
	var key = mac.concat(type);
	var tag = type_tag_map[key];

	if(tag === undefined){
		tag = 0;
	}

	/* Fix 時間進位問題
		example : time 由59分進到00分時絕對值差為59
	*/
	if (Math.abs(tag - mTag)<2 || Math.abs(tag - mTag)==59){
		console.log('mTag=' +mTag+'(key:' +key + '):tag='+tag+' #### drop');
		return true;
	}else{
		type_tag_map[key] = mTag;
		console.log('**** mTag=' +mTag+'(key:' +key + '):tag='+tag +'=>'+mTag+' @@@@ save' );
		return false;
	}
}

