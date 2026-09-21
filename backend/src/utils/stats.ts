export function mean(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}
export function std(xs:number[]){const m=mean(xs);return Math.sqrt(mean(xs.map(x=>(x-m)**2)))}
export function zScore(value:number,xs:number[]){const s=std(xs);return s?Math.abs((value-mean(xs))/s):0}
export function iqrBounds(xs:number[]){const a=[...xs].sort((x,y)=>x-y); if(a.length<4)return {low:-Infinity,high:Infinity}; const q=(p:number)=>{const i=(a.length-1)*p;const lo=Math.floor(i),hi=Math.ceil(i);return a[lo]+(a[hi]-a[lo])*(i-lo)};const q1=q(.25),q3=q(.75),r=q3-q1;return {low:q1-1.5*r,high:q3+1.5*r}}
export function movingAverage(xs:number[],window=3){return xs.length?mean(xs.slice(-window)):0}
export function weightedMovingAverage(xs:number[]){const a=xs.slice(-3); if(!a.length)return 0; const weights=a.map((_,i)=>i+1); return a.reduce((s,v,i)=>s+v*weights[i],0)/weights.reduce((a,b)=>a+b,0)}
