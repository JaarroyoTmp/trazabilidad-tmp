// Agenda de control MT16: meses completos, sin modificar la fecha de calibración.
export function addControlMonths(iso,months){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))throw Error('Indica una fecha de verificación válida.');
 const [y,m,d]=iso.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
 if(date.toISOString().slice(0,10)!==iso)throw Error('La fecha de verificación no existe.');
 if(!Number.isInteger(months)||months<1||months>60)throw Error('Configura en la ficha del equipo una frecuencia entre 1 y 60 meses.');
 const end=new Date(Date.UTC(y,m-1+months+1,0)).getUTCDate();
 return new Date(Date.UTC(y,m-1+months,Math.min(d,end))).toISOString().slice(0,10);
}
export function planMT16Control(equipment,fecha,result){
 addControlMonths(fecha,1);
 const raw=equipment?.frecuencia_calibracion_meses,frequency=Number.isInteger(raw)&&raw>=1&&raw<=60?raw:null;
 const last=[equipment?.fecha_calibracion,equipment?.fecha_ultima_verificacion].filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')).sort().at(-1);
 const base={version:1,fecha_verificacion:fecha,frecuencia_meses:frequency,proxima_fecha:null,accion:'PENDIENTE'};
 if(!['OK','NOK'].includes(result))return base;
 if(last&&fecha<last)return {...base,accion:'HISTORICO'};
 if(result==='NOK')return {...base,accion:'NO_APTO'};
 if(frequency===null)return {...base,accion:'FRECUENCIA_PENDIENTE'};
 return {...base,accion:'RENOVAR',proxima_fecha:addControlMonths(fecha,frequency)};
}
