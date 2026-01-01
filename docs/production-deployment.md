# Production Deployment Checklist

## GitHub App Configuration

### 0. Make App Public (REQUIRED for customer installations)
**CRITICAL**: If your app is private, customers cannot install it!

1. Go to your GitHub App settings: `https://github.com/settings/apps/roastbot-godsfavourwilliams`
2. Scroll to the "Public/Private" or "Visibility" section
3. Change from **Private** to **Public**
4. Save changes

**Why?** Private apps can only be installed by the app owner. Public apps can be installed by anyone.

### 1. Update Webhook URL in GitHub
- Go to your GitHub App settings: `https://github.com/settings/apps/roastbot-godsfavourwilliams`
- Navigate to "Webhook" section
- Update the webhook URL to: `https://www.roastmycode.online/api/webhooks/github`
- Ensure "Active" is checked
- Save changes

### 2. Required Environment Variables in Production

**IMPORTANT**: The environment variable VALUES should be the SAME in both local and production. You're just storing them in different places:

- **Local**: In your `.env.local` file
- **Production**: In your Vercel/Next.js dashboard → Settings → Environment Variables

**The values themselves don't change** - same GitHub App ID, same private key, same webhook secret, etc.

Make sure these are set in your production environment (Vercel/Next.js dashboard):

```bash
# GitHub App Configuration (SAME values as local .env.local)
GITHUB_APP_ID=your_app_id                    # ← Same value as local
GITHUB_PRIVATE_KEY=your_private_key_content   # ← Same value as local
GITHUB_WEBHOOK_SECRET=your_webhook_secret     # ← Same value as local

# Supabase Configuration (SAME values as local .env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url    # ← Same value as local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ← Same value as local
```

**What changes?**
- ✅ **Only the webhook URL in GitHub** changes (from ngrok → production URL)
- ❌ **Environment variables stay the same** (just copy them from `.env.local` to production)

### 3. Verify Webhook Secret Matches

**IMPORTANT**: The `GITHUB_WEBHOOK_SECRET` in your production environment must match the secret configured in your GitHub App settings.

To check/update:
1. Go to GitHub App settings → Webhook section
2. The "Secret" field should match your `GITHUB_WEBHOOK_SECRET` env var (same value in both local and production)
3. If they don't match, either:
   - Update the secret in GitHub App settings, OR
   - Update `GITHUB_WEBHOOK_SECRET` in your production environment

### 4. Test the Webhook

After deployment:
1. Create a test PR in a repository where your app is installed
2. Check your production logs (Vercel dashboard → Functions → Logs)
3. You should see logs like:
   ```
   [GitHub/Webhook] Received event: pull_request (delivery: ...)
   [GitHub/Webhook] Signature verified successfully
   [GitHub/Webhook] Handling pull_request event with action: opened
   ```

### 5. Monitor Webhook Deliveries

GitHub provides webhook delivery logs:
- Go to your GitHub App settings → Webhook → Recent Deliveries
- Check for successful deliveries (green checkmarks)
- If you see red X's, check the error message and your production logs

## Summary: What Changes vs What Stays the Same

### ✅ What Changes (Only 1 thing):
- **GitHub Webhook URL**: Change from ngrok URL → `https://www.roastmycode.online/api/webhooks/github`

### ❌ What Stays the Same (Everything else):
- All environment variables use the **same values**:
  - `GITHUB_APP_ID` - same value
  - `GITHUB_PRIVATE_KEY` - same value  
  - `GITHUB_WEBHOOK_SECRET` - same value
  - `SUPABASE_SERVICE_ROLE_KEY` - same value
  - `NEXT_PUBLIC_SUPABASE_URL` - same value
- You just **copy** them from `.env.local` → Production environment variables

## Troubleshooting

### Webhook not triggering in production?

**Step 1: Verify Route is Accessible**
1. Visit: `https://roastmycode.online/api/webhooks/github/test`
2. You should see a JSON response with environment variable status
3. If you get 404, the route isn't deployed correctly
4. If you see missing config, check your environment variables

**Step 2: Check GitHub App Webhook Configuration**
1. Go to: `https://github.com/settings/apps/roastbot-godsfavourwilliams`
2. Navigate to "Webhook" section
3. Verify the webhook URL is exactly: `https://roastmycode.online/api/webhooks/github`
   - ⚠️ **Important**: Use `https://roastmycode.online` (not `www.roastmycode.online`) if that's your domain
   - The URL must match exactly what you configured
4. Check "Recent Deliveries" tab for failed attempts
5. Click on a failed delivery to see the error message

**Step 3: Verify Environment Variables**
1. In your hosting platform (Vercel/Next.js), go to Settings → Environment Variables
2. Verify these are set (copy exact values from `.env.local`):
   - `GITHUB_APP_ID`
   - `GITHUB_PRIVATE_KEY` (entire PEM key content)
   - `GITHUB_WEBHOOK_SECRET` ⚠️ **CRITICAL** - must match GitHub App settings
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. After updating env vars, **redeploy** your application

**Step 4: Check Production Logs**
1. Go to your hosting platform's logs (Vercel → Functions → Logs)
2. Look for `[GitHub/Webhook]` entries
3. Common errors:
   - `Signature verification failed` → `GITHUB_WEBHOOK_SECRET` mismatch
   - `GITHUB_WEBHOOK_SECRET is not set` → Missing environment variable
   - `Missing GITHUB_APP_ID` → Missing environment variable

**Step 5: Test Webhook Manually**
1. In GitHub App settings → Webhook → Recent Deliveries
2. Click "Redeliver" on a recent failed delivery
3. Check your production logs immediately after
4. You should see: `[GitHub/Webhook] Received event: ...`

### Signature verification failing?

**Most Common Issue**: `GITHUB_WEBHOOK_SECRET` mismatch

1. **Get the secret from GitHub**:
   - Go to GitHub App settings → Webhook
   - The "Secret" field shows what GitHub expects
   - If it's hidden, you may need to reset it

2. **Get the secret from your production environment**:
   - Check your hosting platform's environment variables
   - Copy the exact value of `GITHUB_WEBHOOK_SECRET`

3. **Compare them**:
   - They must match **exactly** (case-sensitive, no extra spaces)
   - If they don't match:
     - Option A: Update `GITHUB_WEBHOOK_SECRET` in production to match GitHub
     - Option B: Update the secret in GitHub App settings to match production
   - **After updating, redeploy your application**

4. **Verify in logs**:
   - After redeploy, check logs for: `[GitHub/Webhook] Signature verified successfully`
   - If still failing, check: `[GitHub/Webhook] Webhook secret length: X`

### Webhook URL Issues

**Domain mismatch (www vs non-www)**:
- If your domain is `roastmycode.online` (no www), use that in GitHub
- If your domain is `www.roastmycode.online` (with www), use that in GitHub
- The URL in GitHub App settings must match your actual domain exactly

**HTTPS required**:
- GitHub requires HTTPS for webhooks
- Ensure your domain has valid SSL certificate
- Test: `curl https://roastmycode.online/api/webhooks/github/test`

### Webhooks going to wrong environment?
- ✅ Remember: GitHub sends to the URL you configure, not automatically to production
- ✅ For local dev: Use ngrok and update GitHub webhook URL temporarily
- ✅ For production: Always point to `https://roastmycode.online/api/webhooks/github` (or your actual domain)
