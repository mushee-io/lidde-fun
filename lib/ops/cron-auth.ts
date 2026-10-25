import {timingSafeEqual} from "node:crypto";
export function allowedCronAuthorization(authorization:string|null,secret:string|undefined){
 if(!secret||secret.length<24||!authorization?.startsWith("Bearer "))return false;
 const candidate=authorization.slice(7);
 const a=Buffer.from(candidate,"utf8"),b=Buffer.from(secret,"utf8");
 return a.length===b.length&&timingSafeEqual(a,b);
}
