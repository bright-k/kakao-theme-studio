import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';
import { atomic, readJson, xml, validId, writeTree, makeKtheme, sha } from './core.mjs';

export async function run(exe,args,{env={},cwd,timeout=120000}={}){
 return new Promise((resolve,reject)=>{let out='';const child=spawn(exe,args,{cwd,env:{...process.env,...env},shell:false});const timer=setTimeout(()=>{child.kill('SIGKILL');},timeout);child.stdout.on('data',b=>{out=(out+b).slice(-200000);});child.stderr.on('data',b=>{out=(out+b).slice(-200000);});child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(code===0)resolve(out);else reject(new Error(`${path.basename(exe)} 실패 (${code}): ${out.slice(-5000)}`));});});
}
const exists=async p=>fs.access(p).then(()=>true,()=>false);
const newest=xs=>xs.sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}))[0];
export async function doctor(){
 const sdk=process.env.ANDROID_SDK_ROOT??process.env.ANDROID_HOME??path.join(os.homedir(),'Library/Android/sdk');
 const homes=[process.env.JAVA_HOME,process.env.STUDIO_JAVA_HOME,path.join(os.homedir(),'Library/Java/JavaVirtualMachines/azul-17.0.5/Contents/Home'),'/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home'].filter(Boolean);
 let javaHome;for(const h of homes)if(await exists(path.join(h,'bin/javac'))){javaHome=h;break;}
 let tools,platform;try{tools=newest((await fs.readdir(path.join(sdk,'build-tools'))).filter(x=>/^\d/.test(x)));platform=newest((await fs.readdir(path.join(sdk,'platforms'))).filter(x=>/^android-\d+$/.test(x)));}catch{}
 const toolDir=tools?path.join(sdk,'build-tools',tools):'';
 const missing=[];if(!javaHome)missing.push('JDK (JAVA_HOME)');if(!platform)missing.push('Android SDK Platform');
 for(const tool of ['aapt2','d8','zipalign','apksigner'])if(!toolDir||!await exists(path.join(toolDir,tool)))missing.push(tool);
 return {ok:missing.length===0,sdk,javaHome,buildTools:tools,platform,api:platform?Number(platform.slice(8)):null,missing,node:process.version};
}
function toolEnv(env){return {JAVA_HOME:env.javaHome,PATH:`${env.javaHome}/bin:${process.env.PATH??'/usr/bin:/bin'}`};}
export class KeyStore {
 constructor(root){this.root=root;this.passwords=new Map();this.busy=false;}
 async records(){return readJson(path.join(this.root,'keys/index.json'),[]);}
 async list(){return (await this.records()).map(k=>({...k,unlocked:this.passwords.has(k.id)}));}
 async fingerprint(file,password){const e=await doctor();if(!e.javaHome)throw new Error('JDK를 찾을 수 없습니다.');const txt=await run(path.join(e.javaHome,'bin/keytool'),['-exportcert','-rfc','-alias','theme','-keystore',file,'-storepass:env','STUDIO_KEY_PASSWORD'],{env:{...toolEnv(e),STUDIO_KEY_PASSWORD:password}});const cert=new crypto.X509Certificate(txt);return cert.fingerprint256;}
 async create(label,password){
  if(this.busy)throw new Error('키 작업이 진행 중입니다.');if(typeof password!=='string'||password.length<8||password.length>128||/[\r\n\0]/.test(password))throw new Error('키 비밀번호는 8~128자로 입력하세요.');if(typeof label!=='string'||!label.trim()||label.length>60)throw new Error('키 이름은 1~60자로 입력하세요.');
  this.busy=true;const id=crypto.randomUUID();const dir=path.join(this.root,'keys');const file=path.join(dir,`${id}.p12`);
  try{const e=await doctor();if(!e.javaHome)throw new Error('JDK가 필요합니다.');await fs.mkdir(dir,{recursive:true,mode:0o700});await run(path.join(e.javaHome,'bin/keytool'),['-genkeypair','-alias','theme','-keyalg','RSA','-keysize','2048','-validity','10000','-storetype','PKCS12','-keystore',file,'-storepass:env','STUDIO_KEY_PASSWORD','-keypass:env','STUDIO_KEY_PASSWORD','-dname','CN=Local Theme Creator','-noprompt'],{env:{...toolEnv(e),STUDIO_KEY_PASSWORD:password}});await fs.chmod(file,0o600);const record={id,label:label.trim(),fingerprint:await this.fingerprint(file,password),createdAt:new Date().toISOString()};const records=await this.records();records.push(record);await atomic(path.join(dir,'index.json'),JSON.stringify(records,null,2));this.passwords.set(id,password);return record;}finally{this.busy=false;}
 }
 async unlock(id,password){if(!validId(id))throw new Error('키 ID가 잘못되었습니다.');const k=(await this.records()).find(k=>k.id===id);if(!k)throw new Error('키를 찾을 수 없습니다.');try{const fp=await this.fingerprint(path.join(this.root,'keys',`${id}.p12`),password);if(fp!==k.fingerprint)throw new Error();this.passwords.set(id,password);return k;}catch{throw new Error('키 비밀번호 또는 인증서가 일치하지 않습니다.');}}
 async import(label,password,buffer){if(this.busy)throw new Error('키 작업이 진행 중입니다.');if(buffer.length>1024*1024)throw new Error('키 파일이 너무 큽니다.');if(typeof label!=='string'||!label.trim()||label.length>60||typeof password!=='string'||password.length<8||password.length>128)throw new Error('키 이름과 8~128자 비밀번호가 필요합니다.');this.busy=true;const id=crypto.randomUUID();const file=path.join(this.root,'keys',`${id}.p12`);try{await atomic(file,buffer);let fp;try{fp=await this.fingerprint(file,password);}catch{await fs.unlink(file);throw new Error('키 파일, theme alias 또는 비밀번호를 확인하세요.');}const records=await this.records();const existing=records.find(k=>k.fingerprint===fp);if(existing){await fs.unlink(file);this.passwords.set(existing.id,password);return existing;}const k={id,label,fingerprint:fp,createdAt:new Date().toISOString()};records.push(k);await atomic(path.join(this.root,'keys/index.json'),JSON.stringify(records,null,2));this.passwords.set(id,password);return k;}finally{this.busy=false;}}
 async signing(id){if(!validId(id))throw new Error('서명키를 선택하세요.');const k=(await this.records()).find(k=>k.id===id);if(!k)throw new Error('서명키를 찾을 수 없습니다. 백업 키를 복원하세요.');const password=this.passwords.get(id);if(!password)throw new Error('서명키 비밀번호를 입력해 잠금을 해제하세요.');return {...k,password,file:path.join(this.root,'keys',`${id}.p12`)};}
}
export function manifest(p,versionCode,api){return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${p.packageId}" android:versionCode="${versionCode}" android:versionName="${p.version}">
 <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="${api}"/>
 <uses-permission android:name="com.kakao.talk.v2.theme"/>
 <queries><package android:name="com.kakao.talk"/></queries>
 <application android:label="@string/app_name" android:icon="@drawable/icon" android:allowBackup="false" android:theme="@android:style/Theme.Material.Light.NoActionBar">
 <meta-data android:name="com.kakao.talk.theme_style" android:value="${p.mode}"/>
 <activity android:name=".MainActivity" android:exported="true">
 <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
 <intent-filter><action android:name="com.kakao.talk.theme.action.MAIN"/></intent-filter>
 </activity></application></manifest>`;}
function activity(p){return `package ${p.packageId};
import android.app.Activity; import android.os.Bundle; import android.content.Intent; import android.net.Uri; import android.widget.*;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle b){super.onCreate(b);LinearLayout layout=new LinearLayout(this);layout.setOrientation(1);layout.setPadding(48,100,48,48);TextView title=new TextView(this);title.setText(getApplicationInfo().loadLabel(getPackageManager()));title.setTextSize(28);layout.addView(title);TextView info=new TextView(this);info.setText("카카오톡 테마 설정에서 이 테마를 선택하세요.");layout.addView(info);Button apply=new Button(this);apply.setText("카카오톡에서 적용하기");apply.setOnClickListener(v->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("kakaotalk://settings/theme/"+getPackageName())));}catch(Exception e){Toast.makeText(this,"카카오톡 설치 여부를 확인하세요.",Toast.LENGTH_LONG).show();}});layout.addView(apply);setContentView(layout);}
}`;}
export async function buildAndroid(compiled,dir,versionCode,key,onStep=()=>{}){
 const e=await doctor();if(!e.ok)throw new Error(`빌드 도구가 없습니다: ${e.missing.join(', ')}`);
 const t=n=>path.join(e.sdk,'build-tools',e.buildTools,n);const env=toolEnv(e);const jar=path.join(e.sdk,'platforms',e.platform,'android.jar');const p=compiled.project;
 const source=path.join(dir,'android-source');await writeTree(compiled.files,source,'android/');await fs.mkdir(path.join(source,'java'),{recursive:true});await fs.writeFile(path.join(source,'AndroidManifest.xml'),manifest(p,versionCode,e.api));const javaFile=path.join(source,'java/MainActivity.java');await fs.writeFile(javaFile,activity(p));
 const flat=path.join(dir,'resources.zip');onStep('Android 리소스 컴파일');await run(t('aapt2'),['compile','--dir',path.join(source,'res'),'-o',flat],{env});
 const resourceApk=path.join(dir,'resources.apk');await run(t('aapt2'),['link','-o',resourceApk,'--manifest',path.join(source,'AndroidManifest.xml'),'-I',jar,flat,'--auto-add-overlay'],{env});
 onStep('Android 실행 코드 생성');const classes=path.join(dir,'classes');await fs.mkdir(classes,{recursive:true});await run(path.join(e.javaHome,'bin/javac'),['--release','8','-encoding','UTF-8','-classpath',jar,'-d',classes,javaFile],{env});
 const classFile=path.join(classes,...p.packageId.split('.'),'MainActivity.class');const dex=path.join(dir,'dex');await fs.mkdir(dex,{recursive:true});await run(t('d8'),['--release','--lib',jar,'--min-api','28','--output',dex,classFile],{env});
 const zip=await JSZip.loadAsync(await fs.readFile(resourceApk));zip.file('classes.dex',await fs.readFile(path.join(dex,'classes.dex')));const table=await zip.file('resources.arsc').async('nodebuffer');zip.file('resources.arsc',table,{compression:'STORE'});const unsigned=path.join(dir,'unsigned.apk');await fs.writeFile(unsigned,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
 onStep('APK 정렬 · 자체 서명');const aligned=path.join(dir,'aligned.apk');const apk=path.join(dir,'theme-android.apk');await run(t('zipalign'),['-f','4',unsigned,aligned],{env});await run(t('apksigner'),['sign','--ks',key.file,'--ks-key-alias','theme','--ks-pass','env:STUDIO_KEY_PASSWORD','--key-pass','env:STUDIO_KEY_PASSWORD','--out',apk,aligned],{env:{...env,STUDIO_KEY_PASSWORD:key.password}});
 onStep('APK 서명 검증');const verify=await run(t('apksigner'),['verify','--verbose','--print-certs',apk],{env});const badging=await run(t('aapt'),['dump','badging',apk],{env});if(!badging.includes(`name='${p.packageId}'`)||!badging.includes(`versionCode='${versionCode}'`))throw new Error('생성 APK의 ID 또는 버전이 다릅니다.');const certHex=key.fingerprint.replaceAll(':','').toLowerCase();if(!verify.toLowerCase().includes(certHex))throw new Error('서명 인증서가 선택한 키와 다릅니다.');await run(t('zipalign'),['-c','4',apk],{env});
 await fs.writeFile(path.join(dir,'signature-verification.txt'),verify);return {apk,versionCode,fingerprint:key.fingerprint,tools:{java:path.basename(e.javaHome),buildTools:e.buildTools,compileSdk:e.api,targetSdk:e.api,minSdk:28},badging};
}
export async function buildBoth(compiled,dataRoot,keyStore,onStep=()=>{}){
 const p=compiled.project;const id=crypto.randomUUID();const dir=path.join(dataRoot,'builds',id);await fs.mkdir(dir,{recursive:true});
 const report={id,projectId:p.id,projectName:p.name,revision:compiled.revision,createdAt:new Date().toISOString(),profile:compiled.profile,compilerVersion:compiled.compilerVersion,coverage:compiled.coverage,diagnostics:compiled.diagnostics,deviceVerified:false,outputs:{},android:{status:'pending'},ios:{status:'pending'}};
 onStep('iOS 테마 패키징');const ktheme=await makeKtheme(compiled);await fs.writeFile(path.join(dir,'theme-ios.ktheme'),ktheme);report.ios={status:'success'};report.outputs['theme-ios.ktheme']=sha(ktheme);
 try{
  const key=await keyStore.signing(p.signingKeyId);const bindingFile=path.join(dataRoot,'bindings',`${p.id}.json`);const binding=await readJson(bindingFile,{packageId:p.packageId,fingerprint:key.fingerprint,lastVersionCode:0});
  if(binding.packageId!==p.packageId||binding.fingerprint!==key.fingerprint)throw new Error('기존 테마의 앱 ID 또는 서명키가 달라 업데이트할 수 없습니다. 기존 키를 복원하세요.');const vc=binding.lastVersionCode+1;await atomic(bindingFile,JSON.stringify({...binding,lastVersionCode:vc}));
  const android=await buildAndroid(compiled,dir,vc,key,onStep);report.android={status:'success',packageId:p.packageId,versionCode:vc,fingerprint:android.fingerprint,tools:android.tools};report.outputs['theme-android.apk']=sha(await fs.readFile(android.apk));
 }catch(e){report.android={status:'failed',message:e.message};}
 report.status=report.android.status==='success'?'success':'partial';
 await fs.writeFile(path.join(dir,'build-report.json'),JSON.stringify(report,null,2));
 await fs.writeFile(path.join(dir,'install-guide.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><title>테마 설치</title><h1>${xml(p.name)}</h1><p>iOS: theme-ios.ktheme를 카카오톡으로 보내 열고 테마를 적용하세요.</p><p>Android: theme-android.apk를 휴대폰에 전달해 설치한 뒤 카카오톡 → 설정 → 테마에서 선택하세요. 기기가 요구하면 사용 중인 파일 앱의 외부 앱 설치를 허용해야 합니다.</p><p>예상 화면과 실제 카카오톡 표시에는 차이가 있을 수 있습니다. 이 빌드의 기기 적용 검증은 수행되지 않았습니다.</p></html>`);
 const z=new JSZip();for(const f of ['theme-ios.ktheme','theme-android.apk','build-report.json','install-guide.html','signature-verification.txt'])if(await exists(path.join(dir,f)))z.file(f,await fs.readFile(path.join(dir,f)));await fs.writeFile(path.join(dir,'theme-bundle.zip'),await z.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));return report;
}
