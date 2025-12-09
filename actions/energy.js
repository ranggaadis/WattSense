"use server";

import { db } from "@/lib/prisma";

export async function getSensorReadings(limit = 200) {
  // If schema migrations haven't been applied yet, avoid crashing the page.
  if (!db?.sensorData || !db?.sensorData2) {
    return { sensorA: [], sensorB: [] };
  }

  try {
    // Fetch latest readings for both PZEMs; adjust as needed when a user filter exists
    const [sensorA, sensorB] = await Promise.all([
      db.sensorData.findMany({
        orderBy: { date: "desc" },
        take: limit,
      }),
      db.sensorData2.findMany({
        orderBy: { date: "desc" },
        take: limit,
      }),
    ]);

    const normalize = (rows, label) =>
      rows
        .map((row) => ({
          id: row.id,
          date: row.date,
        timestamp: row.date.toISOString(),
        voltage: row.voltage,
        ampere: row.ampere,
        power: row.power,
        energy: row.energy,
        pf: row.pf,
        price: row.price,
        sensor: label,
      }))
        // Reorder ascending for charts after fetching desc
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      sensorA: normalize(sensorA, "PZEM A"),
      sensorB: normalize(sensorB, "PZEM B"),
    };
  } catch (err) {
    console.error("Failed to fetch sensor readings:", err?.message || err);
    // On DB/network failure, return empty to keep UI running
    return { sensorA: [], sensorB: [] };
  }
}
