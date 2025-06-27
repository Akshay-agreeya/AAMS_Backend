const cron = require('node-cron');
const dayjs = require('dayjs');
const { freeLightAssementService } = require('../services/freeLightAssessmentService'); 
const { getConnectionPool, sql } = require('../config/db');


// 🔁 Daily at 9 AM
cron.schedule('* 22 * * *', async () => {
  console.log(`[${new Date().toLocaleString()}] ⏳ Starting scheduled accessibility scans...`);

  try {
    const pool = await getConnectionPool();
    const today = dayjs().format('YYYY-MM-DD');

    const result = await pool.request().query(`
  SELECT s.service_id, s.org_id, sd.web_url
  FROM Service s
  JOIN Service_Detail sd ON s.service_detail_id = sd.service_detail_id
  JOIN Frequency f ON s.frequency_id = f.frequency_id
  WHERE s.status = 'Not Started'
    AND CAST(s.next_scan_date AS DATE) <= '${today}'
    AND f.scan_frequency IN ('Weekly', 'Monthly')
`);


    if (result.recordset.length === 0) {
      console.log(`✅ No services due for scanning today.`);
      return;
    }

    for (const service of result.recordset) {
      const { service_id, org_id, web_url } = service;
      console.log(`🔁 Starting scan for service_id ${service.service_id}, URL: ${service.web_url}`);

      try {
        // ✅ Mark service as 'In Progress'
    await pool.request()
    .input('service_id', sql.Int, service_id)
    .query(`UPDATE Service SET status = 'In Progress' WHERE service_id = @service_id`);

        await freeLightAssementService(service.service_id, service.org_id, service.web_url);
        console.log(`✅ Completed scan for service_id ${service.service_id}`);
      } catch (err) {
        console.error(`❌ Failed scan for service_id ${service.service_id}: ${err.message}`);
        await pool.request()
        .input('service_id', sql.Int, service_id)
        .query(`UPDATE Service SET status = 'Not Started' WHERE service_id = @service_id`);  
      }
    }
  } catch (err) {
    console.error(`❌ Scheduler error: ${err.message}`);
  }
});
