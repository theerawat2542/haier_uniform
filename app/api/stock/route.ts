import { NextResponse } from "next/server";
import { Client } from "pg";

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
};

// GET: ดึงข้อมูล Stock ทั้งหมด
export async function GET() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const res = await client.query(`
      SELECT
        sz.id AS size_id,
        i.item_name,
        sz.size,
        sz.stock
      FROM uniform_sizes sz
      LEFT JOIN uniform_items i ON sz.uniform_id = i.id
      ORDER BY i.item_name, sz.size
    `);

    return NextResponse.json({ data: res.rows });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await client.end();
  }
}

// POST: ปรับ stock (เพิ่ม/ลด)
export async function POST(req: Request) {
  const client = new Client(dbConfig);
  try {
    const { size_id, adjustment } = await req.json(); // adjustment: +5 หรือ -3

    if (!size_id || typeof adjustment !== "number") {
      return NextResponse.json({ error: "กรุณาระบุ size_id และ adjustment" }, { status: 400 });
    }

    await client.connect();

    // อัปเดต stock
    const res = await client.query(
      `UPDATE uniform_sizes SET stock = stock + $1 WHERE id = $2 RETURNING *`,
      [adjustment, size_id]
    );

    return NextResponse.json({ data: res.rows[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await client.end();
  }
}
