export function writeLog(key, data){
    let str = '';
    if(typeof data === 'object'){
        str = JSON.stringify(data);
    }else{
        str = data + '';
    }
    let seasonId = '';
    let username = '';
    let cmpt = '';
    console.log(key, ': ', str, ', basic', { seasonId, username, cmpt });
}
