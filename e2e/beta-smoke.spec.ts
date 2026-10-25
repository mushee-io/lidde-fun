import {test,expect} from "@playwright/test";
test("the preview application displays a truthful beta no-go",async({page})=>{
 await page.goto("/beta");
 await expect(page.getByRole("heading",{name:"Beta readiness."})).toBeVisible();
 await expect(page.getByText("preview-only").first()).toBeVisible({timeout:20000});
 await expect(page.getByText("No").first()).toBeVisible();
});
test("perpetuals are offline simulation only and cannot trade",async({page})=>{
 await page.goto("/perps");
 await expect(page.getByRole("heading",{name:"Perpetual risk lab."})).toBeVisible();
 await expect(page.getByText("Position creation, funding").first()).toBeVisible();
 await expect(page.getByRole("button",{name:/Place order|Open trade|Open long|Open short/i})).toHaveCount(0);
});
test("sandbox write APIs are fail closed before operator approval",async({request})=>{
 const wallet="0x1111111111111111111111111111111111111111";
 const [auth,manifest,status]=await Promise.all([
  request.get("/api/quests/challenge?wallet="+wallet),
  request.get("/api/phase2/manifest"),
  request.get("/api/ops/status")
 ]);
 expect(auth.status()).toBe(503);
 expect(manifest.status()).toBe(503);
 expect(status.ok()).toBeTruthy();
 const result=await status.json();
 expect(result.publicBeta).toBe(false);
 expect(result.writeEnabled).toBe(false);
 expect(result.gate).toBe("preview-only");
});
test("available browsing pages do not claim funded quests on an unconfigured network",async({page})=>{
 await page.goto("/quests");
 await expect(page.getByText("Discover. Complete. Claim.")).toBeVisible();
 await expect(page.getByText("Reward infrastructure is not live yet")).toBeVisible({timeout:20000});
});
