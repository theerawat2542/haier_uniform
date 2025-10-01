// app/api/checkTodayRequisition/route.ts (Next.js 13+)
import { NextResponse } from "next/server";
import { Client } from "pg";

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
};

export async function POST(req: Request) {
  const client = new Client(dbConfig);

  try {
    const { htcpersonid } = await req.json();

    if (!htcpersonid) {
      return NextResponse.json({ error: "htcpersonid required" }, { status: 400 });
    }

    await client.connect();

    // ตั้งเวลาเริ่มต้นและสิ้นสุดของวันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const res = await client.query(
      `SELECT COALESCE(SUM(quantity),0) AS total
       FROM uniforms_transaction
       WHERE htcpersonid = $1
         AND created_at >= $2
         AND created_at < $3`,
      [htcpersonid, today.toISOString(), tomorrow.toISOString()]
    );

    const total = Number(res.rows[0].total);

    return NextResponse.json({ total });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await client.end();
  }
}
