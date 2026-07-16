# Connecting the Apply form to a Google Sheet (your "database")

Takes about 5–10 minutes, no coding required — just copy/paste.

## 1. Create the Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **Mathura Overseas — Applications**.
3. In row 1, add these column headers (must match exactly, in this order):

   ```
   submittedAt | refCode | fullName | phone | email | city | country | university | neetScore | percentage | message
   ```

## 2. Add the Apps Script
1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete any starter code and paste this:

   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var p = e.parameter;

     sheet.appendRow([
       p.submittedAt || new Date().toISOString(),
       p.refCode || '',
       p.fullName || '',
       p.phone || '',
       p.email || '',
       p.city || '',
       p.country || '',
       p.university || '',
       p.neetScore || '',
       p.percentage || '',
       p.message || ''
     ]);

     return ContentService.createTextOutput(
       JSON.stringify({ result: 'success' })
     ).setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. Click the **Save** icon and name the project (e.g. "Mathura Applications API").

## 3. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to authorize the script — click through **Authorize access**, choose your Google account, click **Advanced → Go to [project name] (unsafe)**, then **Allow**. (This warning appears because it's your own unpublished script — it's expected and safe.)
6. Copy the **Web app URL** it gives you (ends in `/exec`).

## 4. Connect it to the site
1. Open `js/apply.js`.
2. Find this line near the top:

   ```javascript
   GOOGLE_SCRIPT_URL: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
   ```

3. Replace the placeholder text with the URL you copied, keeping the quotes:

   ```javascript
   GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec'
   ```

4. Save the file and re-upload it to your hosting.

That's it — every "Submit Application" click now appends a new row to your Sheet in real time. You can open the Sheet on your phone, add filters, or connect it to Google Data Studio / a CRM later without touching the website again.

## Notes
- **If you ever need to change the Sheet's columns**, update both the header row and the `sheet.appendRow([...])` line in the script so they stay in the same order.
- **Re-deploying:** if you edit the Apps Script later, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.
- **Until you complete this setup**, the form still works end-to-end for testing — submissions are just kept in the browser's local storage instead of the Sheet, so you can demo the flow safely before going live.
- **Want an email alert too?** Add this line inside `doPost`, right after `sheet.appendRow(...)`:

  ```javascript
  MailApp.sendEmail('you@yourdomain.com', 'New MBBS enquiry: ' + p.fullName,
    'Country: ' + p.country + '\nPhone: ' + p.phone + '\nEmail: ' + p.email);
  ```
