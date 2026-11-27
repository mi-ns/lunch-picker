const crypto=require("node:crypto");
const defaults=require("../config.json");
const COOKIE="__Host-lunch_room_admin";
const TTL=8*60*60, HISTORY_LIMIT=20;
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const spec={maxBoost:[1,3],catChance:[0,100],catWatchChance:[0,100],moveBackProb:[0,100],stayProb:[0,100],moveForwardProb:[0,100]};
const hash=x=>crypto.createHash("sha256").update(x).digest("hex");
const configured=()=>!!((process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL)&&(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN));
function err(status,message){const e=Error(message);e.status=status;return e;}
async function redis(...cmd){
  const url=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
  if(!url||!token||!url.startsWith("https://"))throw err(503,"방 데이터베이스 설정이 필요합니다.");
  const r=await fetch(url.replace(/\/$/,""),{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(cmd),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw err(503,"방 데이터베이스 연결 오류");
  const data=await r.json();if(data.error)throw err(503,"방 데이터베이스 요청 실패");return data.result;
}
function codeKey(code){if(typeof code!=="string"||!/^[A-HJ-NP-Z2-9]{12}$/.test(code))throw err(400,"초대 코드 12자리를 확인하세요.");return "lunch:v2:room:"+hash(code);}
function makeCode(){return Array.from(crypto.randomBytes(12),b=>alphabet[b&31]).join("");}
function textField(value,max,label){if(typeof value!=="string")throw err(400,label+" 입력 오류");const t=value.trim().normalize("NFKC");if(!t||[...t].length>max||! /^[\p{L}\p{N} .,·ㆍ'’&()!+\/_-]+$/u.test(t)||/(https?|ftp|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|kr|io|app|co|xyz|me|ly|link|site|dev)\b)/i.test(t))throw err(400,label+"은 "+max+"자 이내의 일반 문자만 허용합니다. 링크와 HTML은 금지됩니다.");return t;}
function cleanConfig(body){
 if(!Array.isArray(body.restaurants)||body.restaurants.length<1||body.restaurants.length>200||!body.settings)throw err(400,"식당 목록 또는 설정을 확인하세요.");
 const names=new Set();const restaurants=body.restaurants.map(i=>{if(!i||!Number.isInteger(i.priority)||i.priority<1||i.priority>3)throw err(400,"우선도는 1~3이어야 합니다.");const name=textField(i.name,30,"식당명"),type=textField(i.type,20,"종류"),menu=textField(i.menu,80,"대표메뉴");const key=name.toLowerCase().replace(/\s+/g,"");if(names.has(key))throw err(400,"중복 식당명: "+name);names.add(key);return {name,type,menu,priority:i.priority};});
 const settings={};for(const [key,[min,max]] of Object.entries(spec)){const v=body.settings[key];if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)throw err(400,"확률 설정 범위 오류");settings[key]=v;}return {restaurants,settings};
}
function pinHash(pin,salt){return crypto.scryptSync(pin,salt,32).toString("hex");}
function validPin(pin){return typeof pin==="string"&&/^\d{6}$/.test(pin);}
function safeEqual(a,b){return typeof a==="string"&&typeof b==="string"&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));}
function ipKey(req){return hash(String(req.headers["x-vercel-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim());}
async function limit(key,max,seconds){const n=await redis("EVAL","local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,"lunch:v2:limit:"+key,seconds);if(n>max)throw err(429,"요청이 너무 많습니다. 잠시 후 다시 시도하세요.");}
function tokenFrom(req){const item=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));const v=item?.slice(COOKIE.length+1)||"";return /^[a-f0-9]{64}$/.test(v)?v:"";}
function setCookie(res,value,age){res.setHeader("Set-Cookie",COOKIE+"="+value+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+age);}
async function authenticated(req,key){const t=tokenFrom(req);return !!t&&(await redis("GET","lunch:v2:session:"+hash(t)))===key;}
async function issue(req,res,key){const old=tokenFrom(req);if(old)await redis("DEL","lunch:v2:session:"+hash(old));const t=crypto.randomBytes(32).toString("hex");await redis("SET","lunch:v2:session:"+hash(t),key,"EX",TTL);setCookie(res,t,TTL);}
async function getRoom(key){const raw=await redis("GET",key);if(!raw)throw err(404,"초대 코드에 해당하는 방이 없습니다.");return {raw,room:typeof raw==="string"?JSON.parse(raw):raw};}
function entry(revision,action,config){return {revision,action,at:new Date().toISOString(),config};}
function response(room,admin=false){return {name:room.name,config:room.config,revision:room.revision,...(admin?{history:room.history.map(({revision,at,action})=>({revision,at,action}))}:{})};}
async function updateRoom(key,raw,room,config,action){
 const revision=room.revision+1;const next={...room,revision,config,history:[entry(revision,action,config),...room.history].slice(0,HISTORY_LIMIT)};
 const old=typeof raw==="string"?raw:JSON.stringify(raw);
 const ok=await redis("EVAL","if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1",1,key,old,JSON.stringify(next));
 if(ok!==1)throw err(409,"다른 변경 사항이 저장되었습니다. 새로고침 후 다시 수정하세요.");return next;
}
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST")return res.status(405).json({error:"POST 요청만 허용됩니다."});
 if(req.headers.origin!=="https://"+req.headers.host)return res.status(403).json({error:"요청 출처가 올바르지 않습니다."});
 if(!String(req.headers["content-type"]||"").startsWith("application/json"))return res.status(415).json({error:"JSON 요청만 허용됩니다."});
 try{
 if(!configured())throw err(503,"방 데이터베이스 설정이 아직 완료되지 않았습니다.");
 const b=typeof req.body==="string"?JSON.parse(req.body):req.body||{};const action=req.query.action;
 if(action==="create"){
  await limit("create:"+ipKey(req),5,86400);const name=textField(b.name,30,"방 이름");if(!validPin(b.password))throw err(400,"관리자 PIN은 숫자 6자리입니다.");
  const salt=crypto.randomBytes(16).toString("hex"),config=cleanConfig(defaults);
  const room={name,salt,pin:pinHash(b.password,salt),revision:1,config,history:[entry(1,"방 생성",config)]};
  for(let i=0;i<5;i++){const code=makeCode(),key=codeKey(code);if(await redis("SET",key,JSON.stringify(room),"NX")==="OK"){await issue(req,res,key);return res.status(201).json({code,name});}}throw err(503,"방 생성 실패. 다시 시도하세요.");
 }
 if(action==="logout"){const t=tokenFrom(req);if(t)await redis("DEL","lunch:v2:session:"+hash(t));setCookie(res,"",0);return res.json({ok:true});}
 const key=codeKey(b.code);
 if(action==="read"){await limit("read:"+ipKey(req),120,60);const {room}=await getRoom(key);return res.json(response(room));}
 if(action==="session")return res.json({authenticated:await authenticated(req,key)});
 if(action==="login"){
  await limit("login-ip:"+ipKey(req)+":"+key,5,900);await limit("login-room:"+key,30,900);
  const {room}=await getRoom(key);if(!validPin(b.password)||!safeEqual(pinHash(b.password,room.salt),room.pin))throw err(401,"PIN이 올바르지 않습니다.");await issue(req,res,key);return res.json({ok:true});
 }
 if(!await authenticated(req,key))throw err(401,"이 방의 관리자 로그인이 필요합니다.");
 const {raw,room}=await getRoom(key);
 if(action==="config")return res.json(response(room,true));
 if(action==="save"||action==="restore"){
  await limit("write:"+key,60,3600);
  if(b.revision!==room.revision)throw err(409,"다른 변경 사항이 저장되었습니다. 새로고침 후 다시 수정하세요.");
  let config;if(action==="save")config=cleanConfig(b);else{const old=room.history.find(x=>x.revision===b.target);if(!old)throw err(404,"복구할 버전이 없습니다.");config=cleanConfig(old.config);}
  if(JSON.stringify(config)===JSON.stringify(room.config))return res.json(response(room,true));
  const next=await updateRoom(key,raw,room,config,action==="restore"?"v"+b.target+" 복구":"설정 수정");return res.json(response(next,true));
 }
 throw err(400,"지원하지 않는 요청입니다.");
 }catch(e){return res.status(e.status||500).json({error:e.status?e.message:"방 서버 요청 실패. 연결 설정을 확인하세요."});}
};
