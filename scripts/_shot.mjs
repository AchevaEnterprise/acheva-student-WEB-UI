import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
const API='http://localhost:3000', APP=process.env.APP ?? 'http://localhost:4200';
const login = process.env.LOGIN ?? '/auth/lecturers/signin';
const email = process.env.EMAIL, pw = process.env.PW ?? 'Password8@';
const res = await fetch(`${API}${login}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password:pw})});
if(!res.ok) throw new Error(`signin ${res.status}`);
const { data } = await res.json();
const { accessToken, refreshToken, ...account } = data;
mkdirSync('screenshots', { recursive:true });
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,colorScheme:'light'});
await ctx.addInitScript(([t,r,a])=>{localStorage.setItem('token',t);localStorage.setItem('refresh_token',r);localStorage.setItem('active_account',a);},[accessToken,refreshToken,JSON.stringify(account)]);
const page = await ctx.newPage();
page.on('console', m => m.type()==='error' && console.log('  !', m.text().slice(0,140)));
for (const route of (process.env.ROUTES ?? '/support').split(',')) {
  await page.goto(`${APP}${route}`, {waitUntil:'domcontentloaded', timeout:30000});
  await page.waitForTimeout(Number(process.env.WAIT ?? 3500));
  const name = route.replace(/\//g,'_') || 'root';
  await page.screenshot({path:`screenshots/${process.env.TAG ?? 'shot'}${name}.png`});
  console.log('shot', route);
}
await browser.close();
