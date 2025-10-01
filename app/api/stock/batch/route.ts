// app/api/stock/batch/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adjustments } = body; // [{ size_id, adjustment }, ...]

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json({ ok: false, error: "No adjustments provided" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const adj of adjustments) {
        // ปรับ stock โดยใช้ค่า adjustment (บวกหรือลบ)
        await client.query(
          "UPDATE uniform_sizes SET stock = stock + $1 WHERE id = $2",
          [adj.adjustment, adj.size_id]
        );
      }

      await client.query("COMMIT");

      // ดึงข้อมูลอัปเดตล่าสุดของทุก item_id ที่เกี่ยวข้อง
      const sizeIds = adjustments.map((a: any) => a.size_id);
      const { rows } = await client.query(
        `SELECT us.id as size_id, us.size, us.stock, ui.id as item_id, ui.item_name
         FROM uniform_sizes us
         JOIN uniform_items ui ON us.uniform_id = ui.id
         WHERE us.id = ANY($1::int[])`,
        [sizeIds]
      );

      // จัดกลุ่มตาม item
      const data: any[] = [];
      const map: any = {};
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
      await client.query("ROLLBACK");
      console.error(err);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
