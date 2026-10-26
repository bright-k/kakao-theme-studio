import {platformBubbleAssets,platformBubbleState} from '../public/bubble-model.js';
import {RESOURCES,logicalResource,RESOURCE_FILES} from './catalog.mjs';
import {legacyAssetRef,readAsset,registerAsset} from './asset-store.mjs';
import {commonTarget,outputTarget,platformBubbleTarget} from './asset-names.mjs';
export async function migrateAssetReferences(root,project){
 const next=structuredClone(project);let changed=0;
 for(const [slot,ref] of Object.entries(project.assets??{}))if(legacyAssetRef(ref)){next.assets[slot]=await registerAsset(root,next,commonTarget(slot),await readAsset(root,ref,project.assetHashes?.[ref]));changed++;}
 const groups=new Map();for(const [file,ref] of Object.entries(project.resourceOverrides??{}))if(legacyAssetRef(ref)){const f=RESOURCE_FILES.get(file);if(!f)throw new Error('등록되지 않은 출력 원본입니다.');const native=project.nativeNinePatch?.includes(file)??false,key=logicalResource(f)+'|'+ref+'|'+native;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({file,ref,native,id:logicalResource(f)});}
 for(const group of groups.values()){const first=group[0],resource=RESOURCES.find(r=>r.id===first.id),all=group.length===resource.variants.length;if(all){const ref=await registerAsset(root,next,outputTarget(first.file,{resourceId:first.id}),await readAsset(root,first.ref,project.assetHashes?.[first.ref]),{nativeNinePatch:first.native});for(const item of group){next.resourceOverrides[item.file]=ref;changed++;}}else for(const item of group){next.resourceOverrides[item.file]=await registerAsset(root,next,outputTarget(item.file),await readAsset(root,item.ref,project.assetHashes?.[item.ref]),{nativeNinePatch:item.native});changed++;}}
 for(const e of platformBubbleAssets(project))if(legacyAssetRef(e.ref)){const ref=await registerAsset(root,next,platformBubbleTarget(e.platform,e.who,e.group,e.kind),await readAsset(root,e.ref,project.assetHashes?.[e.ref])),state=platformBubbleState(next,e.platform,e.who,e.group);if(e.kind==='body')state.body=ref;else state.character.image=ref;changed++;}
 return {project:next,changed};
}
