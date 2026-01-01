# Webhook Debugging Guide

## ✅ Current Status
- Route is accessible: `https://roastmycode.online/api/webhooks/github`
- All environment variables are configured
- Route structure is correct

## 🔍 Step-by-Step Debugging

### Step 1: Verify Webhook URL in GitHub App Settings

1. Go to: `https://github.com/settings/apps/roastbot-godsfavourwilliams`
2. Click on **"Webhook"** in the left sidebar
3. Check the **"Webhook URL"** field:
   - Should be exactly: `https://roastmycode.online/api/webhooks/github`
   - ⚠️ **No trailing slash**
   - ⚠️ **Must be HTTPS**
   - ⚠️ **Must match your domain exactly** (roastmycode.online, not www.roastmycode.online unless that's your domain)

4. Verify **"Active"** checkbox is checked
5. Click **"Update webhook"** if you made any changes

### Step 2: Check GitHub Webhook Delivery Logs

This is the **most important step** - it shows if GitHub is even trying to send webhooks:

1. In GitHub App settings → **"Webhook"** section
2. Scroll down to **"Recent Deliveries"**
3. Look for recent webhook attempts
4. Check the status:
   - ✅ **Green checkmark** = Success (webhook was delivered)
   - ❌ **Red X** = Failed (click to see error)
   - ⏳ **Yellow circle** = Pending

5. **Click on a failed delivery** to see:
   - HTTP status code (should be 200)
   - Response body
   - Request headers
   - Error message

### Step 3: Check Your Production Logs

After GitHub sends a webhook, check your hosting platform logs:

**If using Vercel:**
1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Click **"Logs"** 
4. Look for entries starting with `[GitHub/Webhook]`

**What to look for:**
- `[GitHub/Webhook] Received event: pull_request` = Webhook received!
- `[GitHub/Webhook] Signature verified successfully` = Good!
- `[GitHub/Webhook] Signature verification failed` = Secret mismatch
- No logs at all = GitHub isn't reaching your server

### Step 4: Test by Triggering a Webhook Event

To test if webhooks are working:

1. **Create a test PR** in a repository where your app is installed
2. **OR** go to GitHub App settings → Webhook → Recent Deliveries → Click **"Redeliver"** on a recent event
3. **Immediately check** your production logs
4. You should see logs appear within seconds

### Step 5: Verify Webhook Secret Match

Even though the test endpoint shows the secret is set, it might not match GitHub:

1. **Get secret from GitHub:**
   - GitHub App settings → Webhook
   - The "Secret" field (if visible) or you may need to reset it

2. **Get secret from production:**
   - Your hosting platform → Environment Variables
   - Copy the exact value of `GITHUB_WEBHOOK_SECRET`

3. **Compare them:**
   - They must match **exactly** (case-sensitive, no spaces)
   - If they don't match:
     - Update `GITHUB_WEBHOOK_SECRET` in production to match GitHub
     - **Redeploy** your application
     - Test again

## 🐛 Common Issues & Solutions

### Issue: "No webhook deliveries in GitHub"
**Solution:** 
- GitHub only sends webhooks when events happen
- Create a test PR or trigger an event
- Make sure the app is installed on a repository

### Issue: "Webhook deliveries show 404"
**Solution:**
- Check webhook URL in GitHub App settings matches exactly
- Verify the route is deployed (test endpoint works, so this should be fine)
- Check for typos in the URL

### Issue: "Webhook deliveries show 401 (Invalid signature)"
**Solution:**
- `GITHUB_WEBHOOK_SECRET` in production doesn't match GitHub App settings
- Update the secret to match exactly
- Redeploy after updating

### Issue: "Webhook deliveries show 500"
**Solution:**
- Check production logs for the actual error
- Common causes:
  - Missing environment variables
  - Database connection issues
  - Code errors in webhook handler

### Issue: "No logs appear when webhook is delivered"
**Solution:**
- Check you're looking at the right environment (production, not local)
- Check log retention settings
- Verify the webhook is actually reaching your server (check GitHub delivery logs)

## 📋 Quick Checklist

- [ ] Webhook URL in GitHub: `https://roastmycode.online/api/webhooks/github`
- [ ] "Active" checkbox is checked in GitHub
- [ ] Checked "Recent Deliveries" in GitHub App settings
- [ ] Checked production logs for `[GitHub/Webhook]` entries
- [ ] Verified `GITHUB_WEBHOOK_SECRET` matches between GitHub and production
- [ ] Triggered a test event (created PR, redelivered webhook)
- [ ] Redeployed after any environment variable changes

## 🎯 Next Steps

1. **Check GitHub's "Recent Deliveries"** - this will tell you if GitHub is trying to send webhooks
2. **Share what you see** in the Recent Deliveries (status codes, error messages)
3. **Check production logs** when a webhook is delivered
4. **Test with a real event** - create a PR in a repo where your app is installed
