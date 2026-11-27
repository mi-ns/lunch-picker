const crypto = require("node:crypto");
const API = "https://api.github.com/repos/mi-ns/lunch-picker/contents/config.json";
const COOKIE = "__Host-lunch_admin";
const TTL = 8 * 60 * 60;
const settingsSpec = {maxBoost:[1,3],catChance:[0,100],catWatchChance:[0,100],moveBackProb:[0,100],stayProb:[0,100],moveForwardProb:[0,100]};
function configured(){return typeof process.env.LUNCH_ADMIN_PASSWORD==="string" && (/^\d{6}$/.test(process.env.LUNCH_ADMIN_PASSWORD) || process.env.LUNCH_ADMIN_PASSWORD.length>=12) && !!process.env.LUNCH_GITHUB_TOKEN;}
// Best-effort per-instance throttle. A shared firewall/rate limiter is required for cross-instance enforcement.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
function loginBucket(req) {
  const now = Date.now();
  for (const [key,value] of attempts) if (value.until <= now) attempts.delete(key);
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0,128);
  if (!attempts.has(ip)) {
    if (attempts.size >= 10000) return {blocked:true};
    attempts.set(ip,{count:0,until:now+WINDOW_MS});
  }
  return attempts.get(ip);
}
function eq(a,b){const x=crypto.createHash("sha256").update(String(a)).digest();const y=crypto.createHash("sha256").update(String(b)).digest();return crypto.timingSafeEqual(x,y);}
function sign(value){return crypto.createHmac("sha256",process.env.LUNCH_GITHUB_TOKEN).update(process.env.LUNCH_ADMIN_PASSWORD+"\0"+value).digest("base64url");}
function session(req){if(!configured())return false;const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));if(!cookie)return false;const [value,sig,...rest]=cookie.slice(COOKIE.length+1).split(".");return rest.length===0 && /^\d{10}-[a-f0-9]{32}$/.test(value||"") && !!sig && Number(value.split("-")[0])>Math.floor(Date.now()/1000) && eq(sig,sign(value));}
function cookie(res,value,maxAge){res.setHeader("Set-Cookie",COOKIE+"="+value+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge);}
function fail(res,status,error){return res.status(status).json({error});}
async function github(method="GET",payload){const result=await fetch(API+(method==="GET"?"?ref=main":""),{method,headers:{Authorization:"Bearer "+process.env.LUNCH_GITHUB_TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(payload?{"Content-Type":"application/json"}:{})},...(payload?{body:JSON.stringify(payload)}:{})});if(!result.ok){const err=Error("GitHub 저장소 접근 오류");err.status=result.status;throw err;}return result.json();}
async function readConfig(){const file=await github();return {config:JSON.parse(Buffer.from(file.content,"base64").toString("utf8")),sha:file.sha};}
function cleanConfig(body){if(!Array.isArray(body.restaurants)||body.restaurants.length<1||body.restaurants.length>200||!body.settings)throw Error("식당 목록 또는 설정을 확인하세요.");const names=new Set();const restaurants=body.restaurants.map(item=>{if(!item||typeof item.name!=="string"||typeof item.type!=="string"||typeof item.menu!=="string"||!Number.isInteger(item.priority)||item.priority<1||item.priority>3)throw Error("식당 정보 형식 오류");const name=item.name.trim(),type=item.type.trim(),menu=item.menu.trim();const key=name.normalize("NFKC").toLowerCase().replace(/\s+/g,"");if(!name||!type||!menu||name.length>100||type.length>40||menu.length>250||names.has(key))throw Error("식당 이름 중복 또는 입력값 오류");names.add(key);return {name,type,menu,priority:item.priority};});const settings={};for(const [key,[min,max]] of Object.entries(settingsSpec)){const value=body.settings[key];if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw Error("확률 설정 범위 오류");settings[key]=value;}return {restaurants,settings};}
module.exports=async function(req,res){res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");const action=req.query.action;
if(req.method==="GET"&&action==="session")return res.status(200).json({configured:configured(),authenticated:session(req)});
if(!configured())return fail(res,503,"관리자 서버 환경변수 설정이 필요합니다.");
if(req.method==="POST"){if(req.headers.origin!=="https://"+req.headers.host)return fail(res,403,"요청 출처가 올바르지 않습니다.");if(!String(req.headers["content-type"]||"").startsWith("application/json"))return fail(res,415,"JSON 요청만 허용됩니다.");}
try {
if(req.method==="POST"&&action==="login"){const bucket=loginBucket(req);if(bucket.blocked||bucket.count>=5){res.setHeader("Retry-After",String(Math.max(1,Math.ceil(((bucket.until||Date.now()+WINDOW_MS)-Date.now())/1000))));return fail(res,429,"로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.");}bucket.count++;const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};if(typeof body.password!=="string"||body.password.length>256||!eq(body.password,process.env.LUNCH_ADMIN_PASSWORD)){await new Promise(resolve=>setTimeout(resolve,700));return fail(res,401,"비밀번호가 올바르지 않습니다.");}bucket.count=0;const value=(Math.floor(Date.now()/1000)+TTL)+"-"+crypto.randomBytes(16).toString("hex");cookie(res,value+"."+sign(value),TTL);return res.status(200).json({ok:true});}
if(req.method==="POST"&&action==="logout"){cookie(res,"",0);return res.status(200).json({ok:true});}
if(!session(req))return fail(res,401,"관리자 로그인이 필요합니다.");
if(req.method==="GET"&&action==="config")return res.status(200).json(await readConfig());
if(req.method==="POST"&&action==="save"){const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};let config;try{config=cleanConfig(body);}catch(e){return fail(res,400,e.message);}const current=await readConfig();if(body.sha!==current.sha)return fail(res,409,"다른 변경 사항이 저장되었습니다. 새로고침 후 다시 수정하세요.");if(JSON.stringify(current.config)===JSON.stringify(config))return res.status(200).json(current);const result=await github("PUT",{message:"Admin: update shared lunch configuration",content:Buffer.from(JSON.stringify(config,null,2)+"\n").toString("base64"),sha:current.sha,branch:"main"});return res.status(200).json({config,sha:result.content.sha});}
return fail(res,405,"지원하지 않는 요청입니다.");
}catch(e){if(e.status===409||e.status===422)return fail(res,409,"저장 충돌 또는 GitHub 권한을 확인하세요.");return fail(res,502,"관리자 서버 요청 실패. GitHub 연결 또는 환경변수를 확인하세요.");}
};
