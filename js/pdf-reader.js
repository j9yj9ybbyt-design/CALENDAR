/* PDF.js operates entirely inside the visitor's browser. */
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
export async function readPdf(file){
if(!globalThis.pdfjsLib)throw new Error('PDF.js non disponibile: verifica la connessione Internet o il blocco delle librerie esterne.');
const pdfjs=globalThis.pdfjsLib;pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_URL;
let document;try{document=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;}catch(e){if(e?.name==='PasswordException')throw new Error(`PDF protetto da password: ${file.name}`);throw new Error(`Impossibile leggere ${file.name}: ${e.message||e}`);}
const pages=[];
for(let i=1;i<=document.numPages;i++){
 let page=await document.getPage(i),content=await page.getTextContent(),viewport=page.getViewport({scale:1});
 let items=content.items.filter(it=>typeof it.str==='string'&&it.str.trim()).map(it=>({str:it.str,x:it.transform[4],y:viewport.height-it.transform[5],width:it.width||0,height:Math.abs(it.height)||Math.abs(it.transform[3])||9}));
 pages.push({width:viewport.width,height:viewport.height,items});
}
return pages;
}
