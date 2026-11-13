function interval(cidr:string):[number,number] {
  if(!/^(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidr))throw new Error('Invalid experiment network range');
  const [ip,prefixText,...extra]=cidr.split('/');const prefix=Number(prefixText);const octets=ip?.split('.').map(Number);
  if(extra.length||!prefixText||!/^\d+$/.test(prefixText)||!Number.isInteger(prefix)||prefix<0||prefix>32||!octets||octets.length!==4||octets.some((v)=>!Number.isInteger(v)||v<0||v>255))throw new Error('Invalid experiment network range');
  const address=octets.reduce((n,v)=>n*256+v,0);const size=2**(32-prefix);const start=Math.floor(address/size)*size;return[start,start+size-1];
}
export function rangesOverlap(a:string,b:string){const[x,y]=interval(a);const[p,q]=interval(b);return x<=q&&p<=y;}
export function chooseExperimentSubnet(occupied:readonly string[]){
  const ranges=occupied.filter((r)=>r!=='0.0.0.0/0'&&!r.includes(':'));ranges.forEach(interval);
  for(let third=0;third<256;third++)for(let fourth=0;fourth<256;fourth+=16){const candidate=`10.253.${third}.${fourth}/28`;if(!ranges.some((r)=>rangesOverlap(candidate,r)))return candidate;}
  throw new Error('No isolated experiment subnet available');
}
