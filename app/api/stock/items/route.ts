// app/api/stock/items/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

// สร้าง pool สำหรับเชื่อมต่อ PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export async function GET() {
  const client = await pool.connect();
  try {
    // ดึงข้อมูลยูนิฟอร์ม + ข้อมูลไซส์และ stock
    const { rows } = await client.query(`
      SELECT 
        ui.id AS item_id,
        ui.item_name,
        us.id AS size_id,
        us.size,
        us.stock
      FROM uniform_items ui
      JOIN uniform_sizes us ON us.uniform_id = ui.id
      ORDER BY ui.item_name, us.size
    `);

    // จัดกลุ่มตามยูนิฟอร์ม
    const map: Record<number, any> = {};
    const data: any[] = [];
    for (const row of rows) {
      if (!map[row.item_id]) {
        map[row.item_id] = { item_id: row.item_id, item_name: row.item_name, sizes: [] };
        data.push(map[row.item_id]);
      }
      map[row.item_id].sizes.push({
        size_id: row.size_id,
        size: row.size,
        stock: row.stock,
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  } finally {
    client.release();
  }
}
