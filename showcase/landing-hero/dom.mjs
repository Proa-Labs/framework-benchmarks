// Copyright Proa Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
// Preserve adjacent text until its element boundary: React inserts comments
// between text slots, and trimming each slot separately would turn "merge 8"
// into "merge8". Preserve preformatted text, script, and style contents.
export async function canonicalDocument(page, html) {
 await page.setContent(html,{waitUntil:'domcontentloaded'});
 return page.evaluate(()=>{
  function element(node, inherited=false) {
   const preserve=inherited||['PRE','TEXTAREA','SCRIPT','STYLE'].includes(node.tagName)||['pre','pre-wrap','pre-line','break-spaces'].includes(getComputedStyle(node).whiteSpace);
   const attrs=[...node.attributes].map(({name,value})=>[name,name==='class'?value.trim().split(/\s+/).sort().join(' '):name==='style'?node.style.cssText:value]).sort(([a],[b])=>a.localeCompare(b));
   const children=[];let text='';
   function flush(){const value=preserve?text:text.replace(/[\t\n\f\r ]+/g,' ').trim();if(value) children.push(['#text',value]);text='';}
   for(const child of node.childNodes){
    if(child.nodeType===Node.COMMENT_NODE)continue;
    if(child.nodeType===Node.TEXT_NODE){text+=child.nodeValue;continue;}
    if(child.nodeType===Node.ELEMENT_NODE){
     if(child.tagName==='LINK'&&child.getAttribute('rel')==='preload')continue;
     flush();children.push(element(child,preserve));
    }
   }
   flush();
   if(node.tagName==='HEAD')children.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
   return [node.tagName.toLowerCase(),attrs,children];
  }
  return [document.compatMode,document.doctype?.name??null,element(document.documentElement)];
 });
}
