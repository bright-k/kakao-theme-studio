import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,newProject} from '../src/core.mjs';
import {doctor,manifest,ANDROID_TARGET_SDK} from '../src/android.mjs';
test('Android builds require current stable SDK tools, ignore previews, and retain Android 9 minimum',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/android-policy-')),java=path.join(root,'jdk');
 const put=async(name,data='')=>{const file=path.join(root,name);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);};
 try{
  await put('jdk/bin/javac');await put('platforms/android-33/android.jar');
  for(const name of ['aapt','aapt2','d8','zipalign','apksigner'])await put('build-tools/33.0.1/'+name);
  let e=await doctor({sdk:root,javaHomes:[java]});assert.equal(e.ok,false);assert.ok(e.missing.includes('Android SDK Platform 37 이상'));assert.ok(e.missing.includes('Android SDK Build-Tools 37 이상'));
  for(const name of ['aapt','aapt2','d8','zipalign','apksigner'])await put('build-tools/37.0.0/'+name);
  await put('build-tools/38.0.0-rc1/aapt2');await put('platforms/android-37.2/android.jar');await put('platforms/android-37.2/source.properties','AndroidVersion.CodeName=\nAndroidVersion.ApiLevel=37.2\n');
  await put('platforms/android-38/android.jar');await put('platforms/android-38/source.properties','AndroidVersion.CodeName=Preview\n');
  e=await doctor({sdk:root,javaHomes:[java]});assert.equal(e.ok,true);assert.equal(e.platform,'android-37.2');assert.equal(e.api,37);assert.equal(e.buildTools,'37.0.0');assert.equal(e.targetSdk,ANDROID_TARGET_SDK);
  const xml=manifest(newProject(),1);assert.match(xml,/minSdkVersion="28"/);assert.match(xml,/targetSdkVersion="37"/);assert.match(xml,/android:exported="true"/);assert.match(xml,/com.kakao.talk.theme.action.MAIN/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
