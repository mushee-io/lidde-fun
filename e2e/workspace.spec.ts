import {test,expect} from "@playwright/test";
test("quest shell has live API-backed empty state and original Lidde Fun identity",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("link",{name:/LiddeFun/i}).first()).toBeVisible();
 await expect(page.getByRole("heading",{name:"Quests"})).toBeVisible();
 await expect(page.getByRole("link",{name:/Create quest/i}).first()).toHaveAttribute("href","/quests/create");
 await expect(page.getByRole("heading",{name:"No verified on-chain quests"})).toBeVisible({timeout:25000});
 await expect(page.getByText("20,000 LAI")).toHaveCount(0);
 await expect(page.getByText("PurrFlow")).toHaveCount(0);
});
test("sidebar tabs change and split controls create and close a second panel",async({page})=>{
 await page.goto("/quest");
 const tabs=page.getByRole("navigation",{name:"Workspace panels"});
 await tabs.getByRole("button",{name:"Tokens"}).click();
 await expect(page.getByRole("button",{name:"Graduated"})).toBeVisible();
 await tabs.getByRole("button",{name:"Alerts"}).click();
 await expect(page.getByRole("button",{name:"Friends"})).toBeVisible();
 await page.getByRole("button",{name:"Split right"}).click();
 await expect(page.getByRole("button",{name:"Close split panel"})).toBeVisible();
 await page.getByRole("button",{name:"Close split panel"}).click();
 await expect(page.getByRole("button",{name:"Close split panel"})).toHaveCount(0);
});
test("perp research terminal offers functional nonfinancial form but no order submission",async({page})=>{
 await page.goto("/perp/BTC");
 await expect(page.getByRole("heading",{name:/BTC/i}).first()).toBeVisible();
 await expect(page.getByText("Awaiting verified market data")).toBeVisible();
 const button=page.getByRole("button",{name:"Trading not deployed"});
 await expect(button).toBeDisabled();
 await page.getByRole("button",{name:"Sell / Short"}).click();
 await expect(page.getByText("Sell opens a short")).toBeVisible();
 await page.getByRole("button",{name:"15m"}).click();
 await expect(page.getByRole("button",{name:"15m"})).toHaveClass(/on/);
 await page.getByRole("button",{name:"25",exact:true}).click();
 await expect(page.getByRole("spinbutton",{name:"Hypothetical collateral amount"})).toHaveValue("25");
});
test("mobile does not overflow and offers operational primary navigation",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/quests");
 await expect(page.getByRole("navigation",{name:"Mobile navigation"})).toBeVisible();
 await expect(page.getByRole("link",{name:/Launch/i}).last()).toHaveAttribute("href","/launch");
 const metrics=await page.evaluate(()=>({
  width:document.documentElement.scrollWidth,viewport:window.innerWidth
 }));
 expect(metrics.width).toBeLessThanOrEqual(metrics.viewport+1);
 await page.getByRole("button",{name:"Toggle workspace menu"}).click();
 await expect(page.getByRole("navigation",{name:"Workspace panels"})).toBeVisible();
});
test("unconfigured detail, identity and activity endpoints fail safely",async({request,page})=>{
 const activity=await request.get("/api/workspace/activity");
 expect(activity.status()).toBe(503);
 const response=await activity.json();
 expect(response.events).toEqual([]);
 await page.goto("/token/0x1111111111111111111111111111111111111111");
 await expect(page.getByText("Token not verified in Lidde discovery")).toBeVisible({timeout:25000});
 await page.goto("/names");
 await expect(page.getByText("Registry not connected")).toBeVisible();
});
